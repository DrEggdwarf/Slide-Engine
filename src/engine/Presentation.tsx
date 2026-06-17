import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SlideModule } from './types'
import { ProgressBar } from '../ui/ProgressBar'
import { Toolbar } from '../ui/Toolbar'
import { Speaker } from '../ui/Speaker'
import { Footer } from '../ui/Footer'
import { NotesPanel } from '../ui/NotesPanel'
import { GridView } from '../ui/GridView'
import { HelpOverlay } from '../ui/HelpOverlay'
import { tokens } from '../design/tokens'

interface PresentationProps {
  slides: SlideModule[]
}

export function Presentation({ slides }: PresentationProps) {
  const [slideIndex, setSlideIndex] = useState(0)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [showToolbar, setShowToolbar] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [gridOpen, setGridOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [cover, setCover] = useState<null | 'black' | 'white'>(null)
  const toolbarTimeoutRef = useRef<number | undefined>(undefined)

  // Chrono : pausable (p) et réinitialisable (t)
  const [now, setNow] = useState(Date.now())
  const [anchor, setAnchor] = useState(Date.now())
  const [accumMs, setAccumMs] = useState(0)
  const [running, setRunning] = useState(true)

  const currentSlide = slides[slideIndex]
  const totalSteps = currentSlide?.meta.steps ?? 0

  // Numérotation : slides principales comptées 01..N, annexes étiquetées A1..An
  const { labels, mainCount, mainPosition } = useMemo(() => {
    let main = 0
    let annexe = 0
    const labels: string[] = []
    const mainPosition: number[] = []
    for (const s of slides) {
      if (s.meta.annexe) {
        annexe += 1
        labels.push(`Annexe A${annexe}`)
        mainPosition.push(-1)
      } else {
        main += 1
        labels.push(`${String(main).padStart(2, '0')} / ${'{TOTAL}'}`)
        mainPosition.push(main)
      }
    }
    return {
      labels: labels.map((l) => l.replace('{TOTAL}', String(main).padStart(2, '0'))),
      mainCount: main,
      mainPosition,
    }
  }, [slides])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [])

  const next = useCallback(() => {
    if (step < totalSteps) {
      setStep((s) => s + 1)
      return
    }
    if (slideIndex < slides.length - 1) {
      setDirection(1)
      setSlideIndex((i) => i + 1)
      setStep(0)
    }
  }, [step, totalSteps, slideIndex, slides.length])

  const prev = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1)
      return
    }
    if (slideIndex > 0) {
      setDirection(-1)
      setSlideIndex((i) => i - 1)
      setStep(slides[slideIndex - 1]?.meta.steps ?? 0)
    }
  }, [step, slideIndex, slides])

  const goToSlide = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= slides.length) return
      setDirection(idx > slideIndex ? 1 : -1)
      setSlideIndex(idx)
      setStep(0)
    },
    [slideIndex, slides.length]
  )

  const resetTimer = useCallback(() => {
    setAccumMs(0)
    setAnchor(Date.now())
    setRunning(true)
  }, [])

  const toggleTimer = useCallback(() => {
    if (running) {
      setAccumMs((a) => a + (Date.now() - anchor))
      setRunning(false)
    } else {
      setAnchor(Date.now())
      setRunning(true)
    }
  }, [running, anchor])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Panneaux modaux : capturent les touches en priorité
      if (showHelp) {
        if (e.key === 'Escape' || e.key === '?' || e.key === 'h') {
          e.preventDefault()
          setShowHelp(false)
        }
        return
      }
      if (cover) {
        if (['b', '.', 'w', ',', 'Escape'].includes(e.key)) {
          e.preventDefault()
          setCover(null)
        }
        return
      }
      if (gridOpen) {
        if (e.key === 'Escape' || e.key === 'g') {
          e.preventDefault()
          setGridOpen(false)
        }
        return
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        goToSlide(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        goToSlide(slides.length - 1)
      } else if (e.key === 's') {
        e.preventDefault()
        setShowNotes((v) => !v)
      } else if (e.key === 'g') {
        e.preventDefault()
        setGridOpen(true)
      } else if (e.key === 'f') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === 'p') {
        e.preventDefault()
        toggleTimer()
      } else if (e.key === 't') {
        e.preventDefault()
        resetTimer()
      } else if (e.key === 'b' || e.key === '.') {
        e.preventDefault()
        setCover('black')
      } else if (e.key === 'w' || e.key === ',') {
        e.preventDefault()
        setCover('white')
      } else if (e.key === '?' || e.key === 'h') {
        e.preventDefault()
        setShowHelp(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, goToSlide, slides.length, gridOpen, showHelp, cover, toggleFullscreen, toggleTimer, resetTimer])

  useEffect(() => {
    const onMove = () => {
      setShowToolbar(true)
      window.clearTimeout(toolbarTimeoutRef.current)
      toolbarTimeoutRef.current = window.setTimeout(() => {
        setShowToolbar(false)
      }, 2500)
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.clearTimeout(toolbarTimeoutRef.current)
    }
  }, [])

  const elapsedMs = accumMs + (running ? now - anchor : 0)
  const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000))
  const minutes = Math.floor(elapsedSec / 60)
  const seconds = elapsedSec % 60
  const elapsedLabel = `${running ? '' : '⏸ '}${minutes}:${seconds.toString().padStart(2, '0')}`

  const progress = useMemo(() => {
    const pos = mainPosition[slideIndex]
    if (pos === -1) return 100
    const slideProgress = totalSteps > 0 ? step / totalSteps : 0
    return Math.min(100, ((pos - 1 + slideProgress) / mainCount) * 100)
  }, [slideIndex, step, totalSteps, mainPosition, mainCount])

  const Component = currentSlide.Component

  return (
    <div className="slide-stage">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -24 }}
          transition={{
            duration: tokens.motion.duration.base,
            ease: tokens.motion.ease.inOut,
          }}
          className="slide-canvas"
        >
          <Component
            step={step}
            totalSteps={totalSteps}
            isActive
            next={next}
            prev={prev}
          />
        </motion.div>
      </AnimatePresence>

      {currentSlide.meta.speaker?.length ? <Speaker who={currentSlide.meta.speaker} /> : null}

      <ProgressBar value={progress} />
      <Footer counter={labels[slideIndex]} />

      <AnimatePresence>{showNotes && <NotesPanel id={currentSlide.id} meta={currentSlide.meta} key={currentSlide.id} />}</AnimatePresence>

      <AnimatePresence>
        {gridOpen && (
          <GridView
            slides={slides}
            labels={labels}
            currentIndex={slideIndex}
            onSelect={(i) => {
              goToSlide(i)
              setGridOpen(false)
            }}
          />
        )}
      </AnimatePresence>

      <Toolbar
        visible={showToolbar && !gridOpen && !cover && !showHelp}
        slideIndex={slideIndex}
        slideCount={slides.length}
        step={step}
        totalSteps={totalSteps}
        elapsed={elapsedLabel}
        onPrev={prev}
        onNext={next}
        canPrev={slideIndex > 0 || step > 0}
        canNext={slideIndex < slides.length - 1 || step < totalSteps}
        onHelp={() => setShowHelp(true)}
      />

      <AnimatePresence>
        {cover && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: tokens.motion.duration.fast }}
            onClick={() => setCover(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: cover === 'black' ? '#000' : '#fff',
              zIndex: 400,
              cursor: 'none',
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}</AnimatePresence>
    </div>
  )
}
