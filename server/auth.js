// ─────────────────────────────────────────────────────────────────────────
//  Authentification (partagée dev ↔ prod).
//
//  Un seul secret : PRESENTER_PASSWORD (ou son hash via PRESENTER_PASSWORD_SHA256).
//  - Le mot de passe ne quitte jamais le serveur.
//  - Le déverrouillage (POST /unlock) est vérifié à temps constant + rate-limité.
//  - En cas de succès : cookie admin (httpOnly, 12 h) + un token PILOTE renvoyé
//    au client (HMAC stateless, 12 h) → c'est lui qui finit dans le QR.
//  Aucune base de données : les tokens sont signés et auto-vérifiables.
// ─────────────────────────────────────────────────────────────────────────
import crypto from 'node:crypto'

const TTL_MS = 12 * 60 * 60 * 1000 // 12 h — assez long pour ne jamais kicker en séance
const COOKIE = 'sid'

// Mot de passe par défaut en local (aucune config). À surcharger en prod via env.
const PASSWORD = process.env.PRESENTER_PASSWORD || 'demo'
// Clé HMAC dérivée du secret (sépare la signature des tokens du mot de passe brut).
const HMAC_KEY = crypto.createHash('sha256').update(`hmac:${PASSWORD}`).digest()

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest()
const b64url = (buf) => Buffer.from(buf).toString('base64url')

// ── Vérification du mot de passe (temps constant) ────────────────────────
export function checkPassword(input) {
  const expected = process.env.PRESENTER_PASSWORD_SHA256
    ? Buffer.from(process.env.PRESENTER_PASSWORD_SHA256, 'hex')
    : sha256(PASSWORD)
  const got = sha256(input ?? '')
  return expected.length === got.length && crypto.timingSafeEqual(got, expected)
}

// ── Tokens HMAC stateless : "role.exp.signature" ─────────────────────────
export function signToken(role, ttlMs = TTL_MS) {
  const exp = Date.now() + ttlMs
  const payload = `${role}.${exp}`
  const sig = b64url(crypto.createHmac('sha256', HMAC_KEY).update(payload).digest())
  return `${payload}.${sig}`
}

export function verifyToken(token, expectedRole) {
  if (typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [role, expStr, sig] = parts
  if (role !== expectedRole) return false
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return false
  const good = b64url(crypto.createHmac('sha256', HMAC_KEY).update(`${role}.${expStr}`).digest())
  const a = Buffer.from(sig), b = Buffer.from(good)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// ── Cookie admin ─────────────────────────────────────────────────────────
function parseCookies(req) {
  const out = {}
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function isAdmin(req) {
  return verifyToken(parseCookies(req)[COOKIE], 'admin')
}

// Connexion depuis la machine locale (utilisé pour l'auto-admin en dev).
export function isLocalReq(req) {
  const a = req.socket.remoteAddress || ''
  return a === '::1' || a.startsWith('127.') || a === '::ffff:127.0.0.1'
}

export { COOKIE }

function isSecure(req) {
  return (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https'
}

// ── Rate-limit du /unlock : token-bucket par IP + lockout ────────────────
const CAP = 5            // 5 tentatives en rafale
const REFILL_MS = 12_000 // +1 jeton toutes les 12 s
const LOCK_FAILS = 10    // après 10 échecs cumulés…
const LOCK_MS = 5 * 60_000 // …blocage 5 min
const buckets = new Map()

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown'
}

function rateLimit(ip) {
  const now = Date.now()
  let b = buckets.get(ip)
  if (!b) { b = { tokens: CAP, last: now, fails: 0, lockUntil: 0 }; buckets.set(ip, b) }
  if (now < b.lockUntil) return { ok: false, retryMs: b.lockUntil - now }
  b.tokens = Math.min(CAP, b.tokens + (now - b.last) / REFILL_MS)
  b.last = now
  if (b.tokens < 1) return { ok: false, retryMs: REFILL_MS }
  b.tokens -= 1
  return { ok: true }
}

function noteFailure(ip) {
  const b = buckets.get(ip)
  if (!b) return
  b.fails += 1
  if (b.fails >= LOCK_FAILS) { b.lockUntil = Date.now() + LOCK_MS; b.fails = 0 }
}

function noteSuccess(ip) {
  const b = buckets.get(ip)
  if (b) { b.fails = 0; b.tokens = CAP }
}

// ── Lecture du corps JSON (petit, borné) ─────────────────────────────────
function readJson(req, limit = 4096) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => { data += c; if (data.length > limit) req.destroy() })
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) } })
    req.on('error', () => resolve({}))
  })
}

const send = (res, code, obj) => {
  res.statusCode = code
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(obj))
}

// Gère POST /unlock — utilisé par le serveur de prod ET le plugin Vite.
export async function handleUnlock(req, res) {
  const ip = clientIp(req)
  const rl = rateLimit(ip)
  if (!rl.ok) {
    res.setHeader('retry-after', Math.ceil(rl.retryMs / 1000))
    return send(res, 429, { error: 'Trop de tentatives. Réessaie plus tard.' })
  }
  const body = await readJson(req)
  if (!checkPassword(body.password)) {
    noteFailure(ip)
    return send(res, 401, { error: 'Mot de passe incorrect.' })
  }
  noteSuccess(ip)
  const cookie = [
    `${COOKIE}=${signToken('admin')}`,
    'HttpOnly', 'SameSite=Lax', 'Path=/', `Max-Age=${Math.floor(TTL_MS / 1000)}`,
    isSecure(req) ? 'Secure' : '',
  ].filter(Boolean).join('; ')
  res.setHeader('set-cookie', cookie)
  return send(res, 200, { token: signToken('pilot'), ttlMs: TTL_MS })
}

export { TTL_MS }
