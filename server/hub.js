// ─────────────────────────────────────────────────────────────────────────
//  Hub de synchro (partagé dev ↔ prod).
//
//  L'ÉTAT CANONIQUE vit ici (et plus dans un onglet navigateur) :
//    { slideIndex, step, running, accumMs, anchor }
//  Les clients ne font que *rendre* cet état. Une commande = une mutation,
//  arbitrée par le serveur puis rediffusée à tout le monde.
//
//  Rôles (sécurité côté serveur uniquement) :
//    - admin  : cookie admin (mot de passe validé)        → peut piloter
//    - pilote : token pilote valide (issu du QR, via hello) → peut piloter
//    - viewer : rien                                        → reçoit l'état seulement
//
//  La navigation (next/prev) est calculée CÔTÉ CLIENT (il connaît les `steps`
//  de chaque slide) puis envoyée en absolu via `set {slideIndex, step}` : le
//  serveur reste agnostique du contenu du deck.
// ─────────────────────────────────────────────────────────────────────────
import os from 'node:os'
import { WebSocketServer } from 'ws'
import { isAdmin, verifyToken, signToken } from './auth.js'

// IP du réseau local (on évite les bridges Docker 172.x).
function lanIP() {
  const all = []
  for (const list of Object.values(os.networkInterfaces())) for (const i of list ?? []) if (i.family === 'IPv4' && !i.internal) all.push(i.address)
  return all.find((a) => a.startsWith('192.168.')) || all.find((a) => a.startsWith('10.')) || all.find((a) => !a.startsWith('172.')) || all[0] || 'localhost'
}

// Origine joignable par les TÉLÉPHONES, pour le QR :
//  - prod derrière proxy : on respecte X-Forwarded-Proto/Host (→ https://prez.exemple.fr)
//  - dev : si l'admin est sur localhost, on remplace par l'IP LAN (sinon le QR serait injoignable)
function pilotOrigin(req) {
  const proto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() || 'http'
  let host = ((req.headers['x-forwarded-host'] || req.headers.host) || '').split(',')[0].trim()
  if (/^(localhost|127\.|\[?::1)/.test(host)) {
    const port = host.includes(':') ? host.split(':').pop() : ''
    host = lanIP() + (port ? `:${port}` : '')
  }
  return `${proto}://${host}`
}

export function attachHub(httpServer) {
  const wss = new WebSocketServer({ noServer: true })
  const state = { slideIndex: 0, step: 0, running: true, accumMs: 0, anchor: Date.now() }
  const roleOf = new WeakMap()    // ws -> 'admin' | 'pilot' | 'viewer'
  const speakerOf = new WeakMap() // ws -> nom (pilotes)

  const stateMsg = () => JSON.stringify({ kind: 'state', state, serverNow: Date.now() })

  const broadcast = () => {
    const m = stateMsg()
    for (const c of wss.clients) if (c.readyState === 1) c.send(m)
  }

  const roster = () => {
    const speakers = [...wss.clients]
      .filter((c) => roleOf.get(c) === 'pilot' && speakerOf.get(c))
      .map((c) => speakerOf.get(c))
    const m = JSON.stringify({ kind: 'roster', speakers })
    for (const c of wss.clients) if (c.readyState === 1) c.send(m)
  }

  const canDrive = (ws) => roleOf.get(ws) === 'admin' || roleOf.get(ws) === 'pilot'

  function applyCmd(cmd) {
    const now = Date.now()
    switch (cmd.cmd) {
      case 'set':
        if (Number.isInteger(cmd.slideIndex) && cmd.slideIndex >= 0) state.slideIndex = cmd.slideIndex
        if (Number.isInteger(cmd.step) && cmd.step >= 0) state.step = cmd.step
        break
      case 'toggleTimer':
        if (state.running) { state.accumMs += now - state.anchor; state.running = false }
        else { state.anchor = now; state.running = true }
        break
      case 'resetTimer':
        state.accumMs = 0; state.anchor = now; state.running = true
        break
      default:
        return false
    }
    return true
  }

  wss.on('connection', (ws, req) => {
    roleOf.set(ws, isAdmin(req) ? 'admin' : 'viewer')
    ws.send(stateMsg())

    ws.on('message', (buf) => {
      let m
      try { m = JSON.parse(buf.toString()) } catch { return }

      if (m.kind === 'hello') {
        if (m.role === 'pilot') {
          if (verifyToken(m.token, 'pilot')) {
            roleOf.set(ws, 'pilot')
            ws.send(JSON.stringify({ kind: 'granted', role: 'pilot' }))
            roster()
          } else {
            ws.send(JSON.stringify({ kind: 'denied' }))
          }
        } else {
          // scène / console / viewer — rôle déjà déduit du cookie à la connexion.
          const role = roleOf.get(ws)
          // un admin reçoit un token pilote frais + l'origine joignable → le QR est prêt à scanner.
          ws.send(JSON.stringify({ kind: 'granted', role, ...(role === 'admin' ? { pilotToken: signToken('pilot'), origin: pilotOrigin(req) } : {}) }))
        }
        ws.send(stateMsg())
        return
      }

      if (m.kind === 'iam' && roleOf.get(ws) === 'pilot') {
        speakerOf.set(ws, m.speaker)
        roster()
        return
      }

      if (m.kind === 'cmd' && canDrive(ws)) {
        if (applyCmd(m)) broadcast()
      }
    })

    ws.on('close', () => { roleOf.delete(ws); speakerOf.delete(ws); roster() })
  })

  // On n'intercepte QUE /sync (le reste — HMR de Vite en dev — passe normalement).
  httpServer.on('upgrade', (req, socket, head) => {
    let pathname = '/'
    try { pathname = new URL(req.url ?? '/', 'http://localhost').pathname } catch { /* ignore */ }
    if (pathname === '/sync') wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
  })

  return wss
}
