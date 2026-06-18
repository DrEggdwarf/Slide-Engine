// Client de synchro temps réel — chemin UNIQUE (WebSocket /sync).
// L'état canonique vit côté serveur ; ce hook ne fait que le refléter et
// envoyer des commandes. Remplace l'ancien deck.ts (BroadcastChannel + WS).
import { useCallback, useEffect, useRef, useState } from 'react'

export interface DeckState {
  slideIndex: number
  step: number
  running: boolean
  accumMs: number
  anchor: number
}

export type Role = 'admin' | 'pilot' | 'viewer'

const INITIAL: DeckState = { slideIndex: 0, step: 0, running: true, accumMs: 0, anchor: Date.now() }
const wsUrl = () => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/sync`

interface UseDeckOpts {
  /** 'stage' = scène/console (admin si cookie) ; 'pilot' = téléphone (token requis) */
  role: 'stage' | 'pilot'
  token?: string | null
}

export interface Deck {
  state: DeckState
  granted: Role | null
  pilotToken: string | null
  /** Origine joignable par les téléphones (fournie par le serveur) pour bâtir l'URL du QR */
  origin: string | null
  roster: string[]
  denied: boolean
  /** Décalage horloge serveur−client (ms), pour un chrono juste à distance */
  offset: () => number
  send: (msg: object) => void
  setPos: (slideIndex: number, step: number) => void
  toggleTimer: () => void
  resetTimer: () => void
  iam: (speaker: string) => void
  reconnect: () => void
}

export function useDeck({ role, token }: UseDeckOpts): Deck {
  const [state, setState] = useState<DeckState>(INITIAL)
  const [granted, setGranted] = useState<Role | null>(null)
  const [pilotToken, setPilotToken] = useState<string | null>(null)
  const [origin, setOrigin] = useState<string | null>(null)
  const [roster, setRoster] = useState<string[]>([])
  const [denied, setDenied] = useState(false)
  const [gen, setGen] = useState(0) // incrémenter = forcer une reconnexion
  const offsetRef = useRef(0)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let closed = false
    const connect = () => {
      const ws = new WebSocket(wsUrl())
      wsRef.current = ws
      ws.onopen = () => ws.send(JSON.stringify({ kind: 'hello', role, token }))
      ws.onmessage = (e) => {
        let m: any
        try { m = JSON.parse(e.data) } catch { return }
        if (m.kind === 'state') {
          setState(m.state)
          if (typeof m.serverNow === 'number') offsetRef.current = m.serverNow - Date.now()
        } else if (m.kind === 'granted') {
          setGranted(m.role); setDenied(false)
          if (m.pilotToken) setPilotToken(m.pilotToken)
          if (m.origin) setOrigin(m.origin)
        } else if (m.kind === 'denied') {
          setDenied(true)
        } else if (m.kind === 'roster') {
          setRoster(m.speakers ?? [])
        }
      }
      ws.onclose = () => { if (!closed) setTimeout(connect, 1500) }
    }
    connect()
    return () => { closed = true; wsRef.current?.close() }
  }, [role, token, gen])

  const send = useCallback((msg: object) => {
    const ws = wsRef.current
    if (ws?.readyState === 1) ws.send(JSON.stringify(msg))
  }, [])

  return {
    state, granted, pilotToken, origin, roster, denied,
    offset: () => offsetRef.current,
    send,
    setPos: (slideIndex, step) => send({ kind: 'cmd', cmd: 'set', slideIndex, step }),
    toggleTimer: () => send({ kind: 'cmd', cmd: 'toggleTimer' }),
    resetTimer: () => send({ kind: 'cmd', cmd: 'resetTimer' }),
    iam: (speaker) => send({ kind: 'iam', speaker }),
    reconnect: () => setGen((g) => g + 1),
  }
}

/** Secondes écoulées calculées depuis l'état serveur (avec correction d'horloge). */
export function elapsedSec(state: DeckState, offset = 0): number {
  const ms = state.accumMs + (state.running ? Date.now() + offset - state.anchor : 0)
  return Math.max(0, Math.floor(ms / 1000))
}

/** Déverrouillage admin : envoie le mot de passe au serveur. */
export async function unlock(password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch('/unlock', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (r.ok) return { ok: true }
    const body = await r.json().catch(() => ({}))
    return { ok: false, error: body.error || `Erreur ${r.status}` }
  } catch {
    return { ok: false, error: 'Réseau indisponible' }
  }
}
