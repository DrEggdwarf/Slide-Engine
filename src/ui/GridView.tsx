import { motion } from 'framer-motion'
import { tokens } from '../design/tokens'
import { SlideModule } from '../engine/types'
import { speakerColor } from '../presentation.config'

interface GridViewProps {
  slides: SlideModule[]
  labels: string[]
  currentIndex: number
  onSelect: (index: number) => void
}

export function GridView({ slides, labels, currentIndex, onSelect }: GridViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: tokens.motion.duration.fast }}
      style={{
        position: 'fixed',
        inset: 0,
        background: tokens.color.surface.base,
        zIndex: 300,
        overflowY: 'auto',
        padding: '56px 64px',
      }}
    >
      <div
        style={{
          fontFamily: tokens.type.family.mono,
          fontSize: tokens.type.size.xs,
          letterSpacing: tokens.type.tracking.wider,
          textTransform: 'uppercase',
          color: tokens.color.text.muted,
          marginBottom: 24,
        }}
      >
        Sommaire — Échap pour fermer
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        {slides.map((slide, i) => {
          const isCurrent = i === currentIndex
          const isAnnexe = slide.meta.annexe === true
          const speakers = slide.meta.speaker ?? []

          return (
            <button
              key={slide.id}
              onClick={() => onSelect(i)}
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 8,
                border: `1px solid ${isCurrent ? tokens.color.text.primary : tokens.color.surface.line}`,
                background: isAnnexe ? tokens.color.surface.subtle : tokens.color.surface.base,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                minHeight: 84,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: tokens.type.family.mono,
                  fontSize: '11px',
                  letterSpacing: tokens.type.tracking.wide,
                  color: tokens.color.text.muted,
                }}
              >
                <span>{labels[i]}</span>
                <span style={{ display: 'flex', gap: 4 }}>
                  {speakers.map((name) => (
                    <span
                      key={name}
                      title={name}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: speakerColor(name),
                      }}
                    />
                  ))}
                </span>
              </div>
              <div
                style={{
                  fontSize: tokens.type.size.sm,
                  fontWeight: tokens.type.weight.medium,
                  color: tokens.color.text.primary,
                  lineHeight: tokens.type.leading.snug,
                }}
              >
                {slide.meta.title ?? slide.id}
              </div>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
