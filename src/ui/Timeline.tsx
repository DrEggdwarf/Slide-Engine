import { motion } from 'framer-motion'
import { tokens } from '../design/tokens'
import { speakerColor } from '../presentation.config'
import type { SlideModule } from '../engine/types'

const MONO = tokens.type.family.mono
const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(Math.abs(s) % 60).toString().padStart(2, '0')}`

interface TimelineProps {
  visible: boolean
  slides: SlideModule[]
  currentIndex: number
  elapsedSec: number
}

/**
 * Timeline de répétition (touche l). Place un jalon par slide, largeur ∝
 * meta.duration (secondes). Le curseur suit le chrono : quand il atteint le
 * bord du segment courant, il est temps d'avancer.
 */
export function Timeline({ visible, slides, currentIndex, elapsedSec }: TimelineProps) {
  if (!visible) return null

  const durs = slides.map((s) => s.meta.duration ?? 60)
  const total = durs.reduce((a, b) => a + b, 0) || 1
  const starts: number[] = []
  durs.reduce((acc, d, i) => { starts[i] = acc; return acc + d }, 0)

  const nowFrac = Math.min(1, Math.max(0, elapsedSec / total))
  const curEnd = (starts[currentIndex] ?? 0) + (durs[currentIndex] ?? 0)
  const remaining = curEnd - elapsedSec
  const status = remaining >= 0 ? tokens.color.semantic.success : tokens.color.semantic.critical

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: tokens.motion.duration.fast }}
      style={{ position: 'fixed', left: '4%', right: '4%', bottom: 52, zIndex: 130, display: 'flex', flexDirection: 'column', gap: 7, pointerEvents: 'none' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11 }}>
        <span style={{ color: tokens.color.text.secondary }}>
          {fmt(elapsedSec)} <span style={{ color: tokens.color.text.muted }}>/ {fmt(total)}</span>
        </span>
        <span style={{ color: status, fontWeight: 700 }}>
          {remaining >= 0 ? `reste ${fmt(remaining)} sur cette slide` : `+${fmt(-remaining)} de retard — avance !`}
        </span>
      </div>

      <div style={{ position: 'relative', height: 16 }}>
        {slides.map((s, i) => {
          const left = (starts[i] / total) * 100
          const width = (durs[i] / total) * 100
          const col = s.meta.speaker?.length ? speakerColor(s.meta.speaker[0]) : tokens.color.text.muted
          const isCur = i === currentIndex
          const done = i < currentIndex
          return (
            <div
              key={s.id}
              style={{
                position: 'absolute', left: `${left}%`, width: `calc(${width}% - 2px)`, top: 0, height: 16,
                borderRadius: 3,
                background: isCur ? col : `${col}${done ? '22' : '3a'}`,
                border: isCur ? `1.5px solid ${col}` : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: isCur ? '#fff' : `${col}cc` }}>{i + 1}</span>
            </div>
          )
        })}
        <div style={{ position: 'absolute', left: `${nowFrac * 100}%`, top: -5, bottom: -5, width: 2, background: status, boxShadow: `0 0 6px ${status}`, transform: 'translateX(-1px)' }} />
        <div style={{ position: 'absolute', left: `${nowFrac * 100}%`, top: -10, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `5px solid ${status}` }} />
      </div>
    </motion.div>
  )
}
