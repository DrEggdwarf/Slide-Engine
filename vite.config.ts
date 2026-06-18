import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'node:os'
import { WebSocketServer, type WebSocket } from 'ws'

// PIN d'accès à la régie mobile (modifiable : PRESENTER_PIN=1234 npm run dev)
const PIN = process.env.PRESENTER_PIN || '4242'
const isLocal = (a?: string) => !!a && (a === '::1' || a.startsWith('127.') || a === '::ffff:127.0.0.1')

// IP du réseau local (on évite les bridges Docker 172.x)
function lanIP(): string {
  const all: string[] = []
  for (const list of Object.values(os.networkInterfaces())) for (const i of list ?? []) if (i.family === 'IPv4' && !i.internal) all.push(i.address)
  return all.find((a) => a.startsWith('192.168.')) || all.find((a) => a.startsWith('10.')) || all.find((a) => !a.startsWith('172.')) || all[0] || 'localhost'
}

interface Tag { authed: boolean; role: string; speaker: string | null }

// Hub de synchro temps réel : la scène (/, en localhost) est l'autorité ;
// les pilotes (téléphones via /pilote) doivent fournir le PIN. Tout message « data » est relayé.
function syncPlugin(): PluginOption {
  return {
    name: 'slide-engine-sync',
    configureServer(server) {
      const http = server.httpServer
      if (!http) return
      const port = server.config.server.port ?? 5173
      // noServer : on n'attache PAS au serveur (sinon on casse le HMR de Vite → reload en boucle).
      const wss = new WebSocketServer({ noServer: true })
      const tags = new WeakMap<WebSocket, Tag>()

      const roster = () => {
        const speakers = [...wss.clients]
          .map((c) => tags.get(c))
          .filter((t): t is Tag => !!t?.authed && t.role === 'pilot' && !!t.speaker)
          .map((t) => t.speaker)
        const msg = JSON.stringify({ t: 'roster', speakers })
        for (const c of wss.clients) if (c.readyState === 1 && tags.get(c)?.authed) c.send(msg)
      }

      wss.on('connection', (ws, req) => {
        tags.set(ws, { authed: false, role: '', speaker: null })
        ws.on('message', (buf) => {
          let m: any
          try { m = JSON.parse(buf.toString()) } catch { return }
          const tag = tags.get(ws)!
          if (m.t === 'hello') {
            if (m.role === 'stage' && isLocal(req.socket.remoteAddress)) { tag.authed = true; tag.role = 'stage' }
            else if (m.role === 'pilot' && m.pin === PIN) { tag.authed = true; tag.role = 'pilot'; tag.speaker = m.speaker ?? null }
            else { ws.send(JSON.stringify({ t: 'denied' })); return }
            ws.send(JSON.stringify(tag.role === 'stage'
              ? { t: 'ok', role: 'stage', pin: PIN, url: `http://${lanIP()}:${port}/pilote` }
              : { t: 'ok', role: 'pilot' }))
            roster()
            return
          }
          if (!tag.authed) return
          if (m.t === 'iam') { tag.speaker = m.speaker; roster(); return }
          const s = buf.toString()
          for (const c of wss.clients) if (c !== ws && c.readyState === 1 && tags.get(c)?.authed) c.send(s)
        })
        ws.on('close', () => roster())
      })

      // On n'intercepte QUE /sync ; tout le reste (HMR de Vite) passe normalement.
      http.on('upgrade', (req, socket, head) => {
        let pathname = '/'
        try { pathname = new URL(req.url ?? '/', 'http://localhost').pathname } catch { /* ignore */ }
        if (pathname === '/sync') wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
      })

      const banner = () => console.log(`\n  [Régie mobile] http://${lanIP()}:${port}/pilote   ·   PIN : ${PIN}\n`)
      if (http.listening) banner(); else http.once('listening', banner)
    },
  }
}

export default defineConfig({
  plugins: [react(), syncPlugin()],
  server: {
    host: true, // expose sur le réseau local (téléphones via IP:5173)
    port: 5173,
    open: false,
  },
})
