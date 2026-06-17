import { ReactNode } from 'react'
import { tokens } from '../design/tokens'

interface HeadlineProps {
  children: ReactNode
  size?: 'lg' | 'xl' | 'huge'
  align?: 'left' | 'center'
  color?: string
}

const sizeMap = {
  lg: tokens.type.size['2xl'],
  xl: tokens.type.size['3xl'],
  huge: tokens.type.size['4xl'],
}

export function Headline({ children, size = 'xl', align = 'center', color }: HeadlineProps) {
  return (
    <h2
      style={{
        fontSize: sizeMap[size],
        fontWeight: tokens.type.weight.semibold,
        letterSpacing: tokens.type.tracking.tight,
        lineHeight: tokens.type.leading.tight,
        color: color ?? tokens.color.text.primary,
        textAlign: align,
        margin: 0,
      }}
    >
      {children}
    </h2>
  )
}
