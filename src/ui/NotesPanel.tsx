import { motion } from 'framer-motion'
import { tokens } from '../design/tokens'
import { SlideMeta } from '../engine/types'

interface NotesPanelProps {
  id: string
  meta: SlideMeta
}

export function NotesPanel({ id, meta }: NotesPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 12, x: '-50%' }}
      transition={{ duration: tokens.motion.duration.fast, ease: tokens.motion.ease.out }}
      style={{
        position: 'fixed',
        bottom: 44,
        left: '50%',
        width: 'min(880px, calc(100vw - 64px))',
        background: tokens.color.surface.subtle,
        border: `1px solid ${tokens.color.surface.line}`,
        borderRadius: 10,
        padding: '14px 20px',
        zIndex: 180,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          marginBottom: meta.notes ? 6 : 0,
          fontFamily: tokens.type.family.mono,
          fontSize: '11px',
          letterSpacing: tokens.type.tracking.wide,
          color: tokens.color.text.muted,
          textTransform: 'uppercase',
        }}
      >
        Notes — {meta.title ?? id}
      </div>
      {meta.notes && (
        <div
          style={{
            fontSize: tokens.type.size.sm,
            lineHeight: tokens.type.leading.normal,
            color: tokens.color.text.secondary,
            textAlign: 'left',
          }}
        >
          {meta.notes}
        </div>
      )}
    </motion.div>
  )
}
