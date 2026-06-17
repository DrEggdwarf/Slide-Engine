import { motion } from 'framer-motion'
import { tokens } from '../design/tokens'

interface ProgressBarProps {
  value: number
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        background: tokens.color.surface.line,
        zIndex: 100,
      }}
    >
      <motion.div
        animate={{ width: `${value}%` }}
        transition={{
          duration: tokens.motion.duration.slow,
          ease: tokens.motion.ease.inOut,
        }}
        style={{
          height: '100%',
          background: tokens.color.text.primary,
        }}
      />
    </div>
  )
}
