import { ReactNode } from 'react'
import { tokens } from '../design/tokens'

interface StatProps {
  value: ReactNode
  label?: ReactNode
  color?: string
  size?: 'lg' | 'xl' | 'huge'
}

const sizeMap = {
  lg: tokens.type.size['4xl'],
  xl: tokens.type.size['5xl'],
  huge: tokens.type.size['6xl'],
}

export function Stat({ value, label, color, size = 'xl' }: StatProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: sizeMap[size],
          fontWeight: tokens.type.weight.semibold,
          letterSpacing: tokens.type.tracking.tighter,
          lineHeight: tokens.type.leading.tight,
          color: color ?? tokens.color.text.primary,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      {label && (
        <div
          style={{
            marginTop: tokens.space[4],
            fontSize: tokens.type.size.md,
            color: tokens.color.text.secondary,
            letterSpacing: tokens.type.tracking.normal,
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
