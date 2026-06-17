import { ReactNode } from 'react'
import { tokens } from '../design/tokens'

interface EyebrowProps {
  children: ReactNode
  color?: string
}

export function Eyebrow({ children, color }: EyebrowProps) {
  return (
    <div
      style={{
        fontSize: tokens.type.size.xs,
        fontWeight: tokens.type.weight.medium,
        letterSpacing: tokens.type.tracking.wider,
        textTransform: 'uppercase',
        color: color ?? tokens.color.text.tertiary,
        fontFamily: tokens.type.family.mono,
      }}
    >
      {children}
    </div>
  )
}
