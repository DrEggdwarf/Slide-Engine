import { tokens } from '../design/tokens'
import { speakerColor } from '../presentation.config'

interface SpeakerProps {
  who: string[]
}

export function Speaker({ who }: SpeakerProps) {
  if (!who.length) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 28,
        left: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontSize: tokens.type.size.xs,
        fontFamily: tokens.type.family.mono,
        letterSpacing: tokens.type.tracking.wider,
        textTransform: 'uppercase',
        zIndex: 150,
      }}
    >
      {who.map((name) => {
        const color = speakerColor(name)
        return (
          <span key={name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
              }}
            />
            <span style={{ color }}>{name}</span>
          </span>
        )
      })}
    </div>
  )
}
