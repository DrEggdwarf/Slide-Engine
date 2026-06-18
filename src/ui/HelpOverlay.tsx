import { useState } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { tokens } from '../design/tokens'

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ['→', '↓', 'Espace'], action: 'Étape ou slide suivante' },
  { keys: ['←', '↑'], action: 'Étape ou slide précédente' },
  { keys: ['Home', 'End'], action: 'Première / dernière slide' },
  { keys: ['g'], action: 'Grille — sommaire navigable' },
  { keys: ['s'], action: 'Notes du présentateur' },
  { keys: ['f'], action: 'Plein écran (démarrer le diaporama)' },
  { keys: ['b', '.'], action: 'Écran noir' },
  { keys: ['w', ','], action: 'Écran blanc' },
  { keys: ['l'], action: 'Timeline — jalons de temps (avancer à l\'heure)' },
  { keys: ['p'], action: 'Pause / reprise du chrono' },
  { keys: ['t'], action: 'Réinitialiser le chrono' },
  { keys: ['?', 'h'], action: 'Afficher / masquer cette aide' },
  { keys: ['Échap'], action: 'Fermer le panneau actif' },
]

interface HelpOverlayProps {
  onClose: () => void
  /** true = cette session est admin (mot de passe validé, ou localhost en dev) */
  unlocked?: boolean
  /** token pilote (présent si admin) → encodé dans le QR */
  pilotToken?: string | null
  /** origine joignable par les téléphones (fournie par le serveur) */
  origin?: string | null
  /** déverrouillage par mot de passe ; renvoie { ok, error? } */
  onUnlock?: (password: string) => Promise<{ ok: boolean; error?: string }>
}

export function HelpOverlay({ onClose, unlocked, pilotToken, origin, onUnlock }: HelpOverlayProps) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!onUnlock || !pw) return
    setBusy(true); setErr('')
    const r = await onUnlock(pw)
    setBusy(false)
    if (r.ok) setPw('')
    else setErr(r.error || 'Échec')
  }

  const pilotUrl = pilotToken ? `${origin ?? location.origin}/pilote?t=${pilotToken}` : ''

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: tokens.motion.duration.fast }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: tokens.motion.duration.fast, ease: tokens.motion.ease.out }} onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(560px, calc(100vw - 64px))', background: tokens.color.surface.base, border: `1px solid ${tokens.color.surface.line}`, borderRadius: 14, padding: '28px 32px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
      >
        <div style={{ fontFamily: tokens.type.family.mono, fontSize: tokens.type.size.xs, letterSpacing: tokens.type.tracking.wider, textTransform: 'uppercase', color: tokens.color.text.muted, marginBottom: 20 }}>
          Raccourcis clavier
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SHORTCUTS.map((s) => (
            <div key={s.action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ fontSize: tokens.type.size.sm, color: tokens.color.text.secondary }}>{s.action}</span>
              <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {s.keys.map((k) => (
                  <kbd key={k} style={{ fontFamily: tokens.type.family.mono, fontSize: '11px', color: tokens.color.text.primary, background: tokens.color.surface.subtle, border: `1px solid ${tokens.color.surface.line}`, borderRadius: 6, padding: '3px 8px', lineHeight: 1 }}>{k}</kbd>
                ))}
              </span>
            </div>
          ))}
        </div>

        {/* Régie mobile : verrouillée tant que le mot de passe n'est pas validé */}
        <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${tokens.color.surface.line}` }}>
          {unlocked && pilotToken ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ background: '#fff', padding: 8, borderRadius: 8, flexShrink: 0, lineHeight: 0 }}>
                <QRCodeSVG value={pilotUrl} size={104} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                <span style={{ fontFamily: tokens.type.family.mono, fontSize: tokens.type.size.xs, letterSpacing: tokens.type.tracking.wider, textTransform: 'uppercase', color: tokens.color.semantic.success }}>Régie déverrouillée — scanne pour piloter</span>
                <span style={{ fontFamily: tokens.type.family.mono, fontSize: '12px', color: tokens.color.text.secondary, overflowWrap: 'anywhere' }}>{pilotUrl}</span>
                <span style={{ fontFamily: tokens.type.family.mono, fontSize: '11px', color: tokens.color.text.muted }}>Montre ce QR aux autres orateurs (il porte un accès à durée limitée).</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontFamily: tokens.type.family.mono, fontSize: tokens.type.size.xs, letterSpacing: tokens.type.tracking.wider, textTransform: 'uppercase', color: tokens.color.text.muted }}>Régie mobile — verrouillée</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="password" value={pw} autoFocus placeholder="Mot de passe régie"
                  onChange={(e) => setPw(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
                  style={{ flex: 1, fontFamily: tokens.type.family.mono, fontSize: '14px', padding: '10px 12px', borderRadius: 8, border: `1px solid ${tokens.color.surface.line}`, background: tokens.color.surface.subtle, color: tokens.color.text.primary, outline: 'none' }}
                />
                <button onClick={submit} disabled={busy || !pw}
                  style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: busy || !pw ? tokens.color.surface.line : tokens.color.text.primary, color: tokens.color.surface.base, fontFamily: tokens.type.family.mono, fontSize: '13px', fontWeight: 700 }}>
                  {busy ? '…' : 'Déverrouiller'}
                </button>
              </div>
              {err && <span style={{ fontFamily: tokens.type.family.mono, fontSize: '12px', color: tokens.color.semantic.critical }}>{err}</span>}
              <span style={{ fontFamily: tokens.type.family.mono, fontSize: '11px', color: tokens.color.text.muted }}>Déverrouille pour afficher le QR de pilotage mobile.</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: 22, fontSize: '11px', fontFamily: tokens.type.family.mono, color: tokens.color.text.muted, letterSpacing: tokens.type.tracking.wide }}>
          Échap ou clic pour fermer
        </div>
      </motion.div>
    </motion.div>
  )
}
