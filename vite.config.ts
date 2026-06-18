import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { attachHub } from './server/hub.js'
import { handleUnlock, isLocalReq, signToken, COOKIE, TTL_MS } from './server/auth.js'

// En dev, on branche EXACTEMENT le même hub/serveur qu'en prod, plus :
//  - POST /unlock (déverrouillage par mot de passe)
//  - auto-admin localhost : ta machine est admin sans rien taper (zéro config).
//    Un téléphone du LAN, lui, reste viewer → il devra passer par le token du QR.
function controlPlugin(): PluginOption {
  return {
    name: 'slide-engine-control',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || '/').split('?')[0]
        if (path === '/unlock' && req.method === 'POST') { handleUnlock(req, res); return }
        const wantsHtml = (req.headers.accept || '').includes('text/html')
        const hasCookie = (req.headers.cookie || '').includes(`${COOKIE}=`)
        if (isLocalReq(req) && wantsHtml && !hasCookie) {
          res.setHeader('set-cookie', `${COOKIE}=${signToken('admin')}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(TTL_MS / 1000)}`)
        }
        next()
      })
      if (server.httpServer) attachHub(server.httpServer)
    },
  }
}

export default defineConfig({
  plugins: [react(), controlPlugin()],
  server: {
    host: true, // accessible sur le réseau local (téléphones via IP:5173)
    port: 5173,
    open: false,
  },
})
