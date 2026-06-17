import { motion, AnimatePresence } from 'framer-motion'
import { tokens } from '../design/tokens'

interface ToolbarProps {
  visible: boolean
  slideIndex: number
  slideCount: number
  step: number
  totalSteps: number
  elapsed: string
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
  onHelp?: () => void
}

export function Toolbar({
  visible,
  slideIndex,
  slideCount,
  step,
  totalSteps,
  elapsed,
  onPrev,
  onNext,
  canPrev,
  canNext,
  onHelp,
}: ToolbarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 8, x: '-50%' }}
          transition={{
            duration: tokens.motion.duration.fast,
            ease: tokens.motion.ease.inOut,
          }}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '10px 16px',
            background: tokens.color.surface.base,
            border: `1px solid ${tokens.color.surface.line}`,
            borderRadius: 100,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            zIndex: 200,
            fontSize: tokens.type.size.xs,
            fontFamily: tokens.type.family.mono,
            color: tokens.color.text.secondary,
          }}
        >
          <button
            onClick={onPrev}
            disabled={!canPrev}
            style={{
              opacity: canPrev ? 1 : 0.3,
              padding: '4px 8px',
              fontSize: tokens.type.size.xs,
              fontFamily: tokens.type.family.mono,
              color: tokens.color.text.primary,
              cursor: canPrev ? 'pointer' : 'not-allowed',
            }}
          >
            ←
          </button>

          <span style={{ minWidth: 56, textAlign: 'center', letterSpacing: tokens.type.tracking.wide }}>
            {String(slideIndex + 1).padStart(2, '0')} / {String(slideCount).padStart(2, '0')}
          </span>

          {totalSteps > 0 && (
            <span style={{ color: tokens.color.text.tertiary, fontSize: '11px' }}>
              {step}/{totalSteps}
            </span>
          )}

          <button
            onClick={onNext}
            disabled={!canNext}
            style={{
              opacity: canNext ? 1 : 0.3,
              padding: '4px 8px',
              fontSize: tokens.type.size.xs,
              fontFamily: tokens.type.family.mono,
              color: tokens.color.text.primary,
              cursor: canNext ? 'pointer' : 'not-allowed',
            }}
          >
            →
          </button>

          <span
            style={{
              borderLeft: `1px solid ${tokens.color.surface.line}`,
              paddingLeft: 16,
              color: tokens.color.text.tertiary,
              letterSpacing: tokens.type.tracking.wide,
            }}
          >
            {elapsed}
          </span>

          {onHelp && (
            <button
              onClick={onHelp}
              title="Aide — raccourcis clavier (?)"
              style={{
                marginLeft: -4,
                padding: '4px 9px',
                fontSize: tokens.type.size.xs,
                fontFamily: tokens.type.family.mono,
                color: tokens.color.text.tertiary,
                cursor: 'pointer',
              }}
            >
              ?
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
