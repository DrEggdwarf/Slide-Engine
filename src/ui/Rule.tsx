import { motion } from 'framer-motion'
import { tokens } from '../design/tokens'

interface RuleProps {
  width?: number | string
  vertical?: boolean
  animate?: boolean
}

export function Rule({ width = 64, vertical = false, animate = true }: RuleProps) {
  if (vertical) {
    return (
      <div
        style={{
          width: 1,
          height: typeof width === 'number' ? width : 64,
          background: tokens.color.surface.lineStrong,
        }}
      />
    )
  }

  if (!animate) {
    return (
      <div
        style={{
          width,
          height: 1,
          background: tokens.color.surface.lineStrong,
        }}
      />
    )
  }

  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{
        duration: tokens.motion.duration.slow,
        ease: tokens.motion.ease.inOut,
      }}
      style={{
        width,
        height: 1,
        background: tokens.color.surface.lineStrong,
        transformOrigin: 'left',
      }}
    />
  )
}
