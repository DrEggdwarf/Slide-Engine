import { ReactNode } from 'react'
import { tokens } from '../design/tokens'

interface LedeProps {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'center'
  color?: string
  maxWidth?: number
}

const sizeMap = {
  sm: tokens.type.size.md,
  md: tokens.type.size.lg,
  lg: tokens.type.size.xl,
}

export function Lede({ children, size = 'md', align = 'center', color, maxWidth = 720 }: LedeProps) {
  return (
    <p
      style={{
        fontSize: sizeMap[size],
        fontWeight: tokens.type.weight.regular,
        lineHeight: tokens.type.leading.snug,
        letterSpacing: tokens.type.tracking.tight,
        color: color ?? tokens.color.text.secondary,
        textAlign: align,
        maxWidth,
        margin: '0 auto',
      }}
    >
      {children}
    </p>
  )
}
