import { tokens } from '../design/tokens'
import { config } from '../presentation.config'

interface FooterProps {
  counter: string
}

export function Footer({ counter }: FooterProps) {
  const base = {
    position: 'fixed' as const,
    bottom: 14,
    fontSize: '11px',
    fontFamily: tokens.type.family.mono,
    letterSpacing: tokens.type.tracking.wide,
    color: tokens.color.text.muted,
    zIndex: 120,
    userSelect: 'none' as const,
  }

  return (
    <>
      <div style={{ ...base, left: 32 }}>{config.brand}</div>
      <div style={{ ...base, right: 32 }}>{counter}</div>
    </>
  )
}
