// ─────────────────────────────────────────────────────────────────────────
//  Serveur de PRODUCTION (déployable, ex. via Kamal).
//
//  Un seul process qui :
//   1. sert le build statique (dist/),
//   2. retombe sur index.html pour /console et /pilote (fallback SPA),
//   3. expose POST /unlock (déverrouillage par mot de passe, rate-limité),
//   4. fait tourner le hub de synchro WS (/sync) — le MÊME qu'en dev.
//
//  Aucune dépendance web lourde : http natif + le module `ws`.
//  Démarrage : PRESENTER_PASSWORD=… node server/index.js
// ─────────────────────────────────────────────────────────────────────────
import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { attachHub } from './hub.js'
import { handleUnlock } from './auth.js'

const DIST = fileURLToPath(new URL('../dist', import.meta.url))
const PORT = Number(process.env.PORT || 3000)

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.map': 'application/json',
}

async function sendFile(res, path, cache = false) {
  const body = await readFile(path)
  res.setHeader('content-type', MIME[extname(path)] || 'application/octet-stream')
  if (cache) res.setHeader('cache-control', 'public, max-age=31536000, immutable')
  res.end(body)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost')

  if (url.pathname === '/up') { res.statusCode = 200; return res.end('OK') }
  if (url.pathname === '/unlock' && req.method === 'POST') return handleUnlock(req, res)
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.statusCode = 405; return res.end() }

  // Fichier statique (anti path-traversal : on reste sous DIST)
  const rel = normalize(url.pathname).replace(/^(\.\.([/\\]|$))+/, '')
  const filePath = join(DIST, rel)
  if (filePath.startsWith(DIST)) {
    try {
      const s = await stat(filePath)
      if (s.isFile()) return await sendFile(res, filePath, rel.startsWith('assets/'))
    } catch { /* pas un fichier → fallback */ }
  }

  // Fallback SPA → index.html (sert /, /console, /pilote, etc.)
  try { return await sendFile(res, join(DIST, 'index.html')) }
  catch { res.statusCode = 404; res.end('Build introuvable — lance `npm run build`.') }
})

attachHub(server)
server.listen(PORT, () => console.log(`Slide-Engine (prod) sur le port ${PORT}`))
