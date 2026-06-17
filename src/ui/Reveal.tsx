import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { tokens } from '../design/tokens'

interface RevealProps {
  children: ReactNode
  show: boolean
  delay?: number
  y?: number
  duration?: number
}

export function Reveal({ children, show, delay = 0, y = 12, duration }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{
        duration: duration ?? tokens.motion.duration.slow,
        ease: tokens.motion.ease.out,
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}
