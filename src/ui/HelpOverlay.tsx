import { motion } from 'framer-motion'
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
  { keys: ['p'], action: 'Pause / reprise du chrono' },
  { keys: ['t'], action: 'Réinitialiser le chrono' },
  { keys: ['?', 'h'], action: 'Afficher / masquer cette aide' },
  { keys: ['Échap'], action: 'Fermer le panneau actif' },
]

interface HelpOverlayProps {
  onClose: () => void
}

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: tokens.motion.duration.fast }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,10,10,0.55)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: tokens.motion.duration.fast, ease: tokens.motion.ease.out }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, calc(100vw - 64px))',
          background: tokens.color.surface.base,
          border: `1px solid ${tokens.color.surface.line}`,
          borderRadius: 14,
          padding: '28px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            fontFamily: tokens.type.family.mono,
            fontSize: tokens.type.size.xs,
            letterSpacing: tokens.type.tracking.wider,
            textTransform: 'uppercase',
            color: tokens.color.text.muted,
            marginBottom: 20,
          }}
        >
          Raccourcis clavier
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SHORTCUTS.map((s) => (
            <div
              key={s.action}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <span
                style={{
                  fontSize: tokens.type.size.sm,
                  color: tokens.color.text.secondary,
                }}
              >
                {s.action}
              </span>
              <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    style={{
                      fontFamily: tokens.type.family.mono,
                      fontSize: '11px',
                      color: tokens.color.text.primary,
                      background: tokens.color.surface.subtle,
                      border: `1px solid ${tokens.color.surface.line}`,
                      borderRadius: 6,
                      padding: '3px 8px',
                      lineHeight: 1,
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: '11px',
            fontFamily: tokens.type.family.mono,
            color: tokens.color.text.muted,
            letterSpacing: tokens.type.tracking.wide,
          }}
        >
          Échap ou clic pour fermer
        </div>
      </motion.div>
    </motion.div>
  )
}
