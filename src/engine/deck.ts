// Synchronisation scène (/) ↔ régie (/console) sur le même navigateur, via BroadcastChannel.
// La scène est l'autorité de navigation : elle exécute les commandes et diffuse l'état.
// Le même protocole transite aussi par WebSocket (/sync) pour les pilotes mobiles (/pilote).
export const DECK_CHANNEL = 'slide-engine-deck-v1'

export interface DeckState {
  slideIndex: number
  step: number
  running: boolean
  accumMs: number
  anchor: number
}

export type DeckMsg =
  | { kind: 'state'; state: DeckState }
  | { kind: 'cmd'; cmd: 'next' | 'prev' | 'first' | 'last' | 'toggleTimer' | 'resetTimer' | 'hello' }
  | { kind: 'cmd'; cmd: 'goto'; index: number }
