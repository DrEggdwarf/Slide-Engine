import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SlideModule } from './types'
import { useDeck, elapsedSec, unlock } from './sync'
import { ProgressBar } from '../ui/ProgressBar'
import { Toolbar } from '../ui/Toolbar'
import { Speaker } from '../ui/Speaker'
import { Footer } from '../ui/Footer'
import { NotesPanel } from '../ui/NotesPanel'
import { GridView } from '../ui/GridView'
import { HelpOverlay } from '../ui/HelpOverlay'
import { Timeline } from '../ui/Timeline'
import { tokens } from '../design/tokens'

interface PresentationProps {
  slides: SlideModule[]
}

export function Presentation({ slides }: PresentationProps) {
  // L'état de navigation vient du serveur (useDeck). Cet écran ne fait que le rendre ;
  // s'il est admin (mot de passe validé, ou localhost en dev) il peut piloter.
  const deck = useDeck({ role: 'stage' })
  const { state } = deck
  const isAdmin = deck.granted === 'admin'

  const [direction, setDirection] = useState<1 | -1>(1)
  const [showToolbar, setShowToolbar] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [gridOpen, setGridOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [cover, setCover] = useState<null | 'black' | 'white'>(null)
  const [, setTick] = useState(0) // force le rafraîchissement du chrono
  const toolbarTimeoutRef = useRef<number | undefined>(undefined)

  const currentSlide = slides[state.slideIndex]
  const totalSteps = currentSlide?.meta.steps ?? 0

  // Numérotation : slides principales 01..N, annexes A1..An
  const { labels, mainCount, mainPosition } = useMemo(() => {
    let main = 0, annexe = 0
    const labels: string[] = []
    const mainPosition: number[] = []
    for (const s of slides) {
      if (s.meta.annexe) { annexe += 1; labels.push(`Annexe A${annexe}`); mainPosition.push(-1) }
      else { main += 1; labels.push(`${String(main).padStart(2, '0')} / ${'{TOTAL}'}`); mainPosition.push(main) }
    }
    return { labels: labels.map((l) => l.replace('{TOTAL}', String(main).padStart(2, '0'))), mainCount: main, mainPosition }
  }, [slides])

  useEffect(() => { const id = window.setInterval(() => setTick((t) => t + 1), 500); return () => window.clearInterval(id) }, [])

  // Sens d'animation déduit du changement d'index serveur
  const prevIndexRef = useRef(state.slideIndex)
  useEffect(() => {
    if (state.slideIndex !== prevIndexRef.current) {
      setDirection(state.slideIndex > prevIndexRef.current ? 1 : -1)
      prevIndexRef.current = state.slideIndex
    }
  }, [state.slideIndex])

  // Navigation : on calcule la cible ici (on connaît les `steps`) puis on l'envoie en absolu.
  const next = () => {
    const ts = slides[state.slideIndex]?.meta.steps ?? 0
    if (state.step < ts) deck.setPos(state.slideIndex, state.step + 1)
    else if (state.slideIndex < slides.length - 1) deck.setPos(state.slideIndex + 1, 0)
  }
  const prev = () => {
    if (state.step > 0) deck.setPos(state.slideIndex, state.step - 1)
    else if (state.slideIndex > 0) deck.setPos(state.slideIndex - 1, slides[state.slideIndex - 1]?.meta.steps ?? 0)
  }
  const goToSlide = (idx: number) => { if (idx >= 0 && idx < slides.length) deck.setPos(idx, 0) }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  const onUnlock = async (password: string) => {
    const r = await unlock(password)
    if (r.ok) deck.reconnect() // recharge la session WS → reconnue admin (cookie) + token pilote
    return r
  }

  // Clavier : handler stable qui lit toujours l'état courant via une ref
  const onKeyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  onKeyRef.current = (e: KeyboardEvent) => {
    if (showHelp) { if (['Escape', '?', 'h'].includes(e.key)) { e.preventDefault(); setShowHelp(false) } return }
    if (cover) { if (['b', '.', 'w', ',', 'Escape'].includes(e.key)) { e.preventDefault(); setCover(null) } return }
    if (gridOpen) { if (['Escape', 'g'].includes(e.key)) { e.preventDefault(); setGridOpen(false) } return }

    // Bascules d'affichage — disponibles pour tous
    if (e.key === 's') { e.preventDefault(); setShowNotes((v) => !v); return }
    if (e.key === 'g') { e.preventDefault(); setGridOpen(true); return }
    if (e.key === 'f') { e.preventDefault(); toggleFullscreen(); return }
    if (e.key === 'l') { e.preventDefault(); setShowTimeline((v) => !v); return }
    if (e.key === 'b' || e.key === '.') { e.preventDefault(); setCover('black'); return }
    if (e.key === 'w' || e.key === ',') { e.preventDefault(); setCover('white'); return }
    if (e.key === '?' || e.key === 'h') { e.preventDefault(); setShowHelp(true); return }

    // Pilotage — réservé à l'admin (le serveur rejette de toute façon les autres)
    if (!isAdmin) return
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); next() }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); prev() }
    else if (e.key === 'Home') { e.preventDefault(); goToSlide(0) }
    else if (e.key === 'End') { e.preventDefault(); goToSlide(slides.length - 1) }
    else if (e.key === 'p') { e.preventDefault(); deck.toggleTimer() }
    else if (e.key === 't') { e.preventDefault(); deck.resetTimer() }
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKeyRef.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    const onMove = () => {
      setShowToolbar(true)
      window.clearTimeout(toolbarTimeoutRef.current)
      toolbarTimeoutRef.current = window.setTimeout(() => setShowToolbar(false), 2500)
    }
    window.addEventListener('mousemove', onMove)
    return () => { window.removeEventListener('mousemove', onMove); window.clearTimeout(toolbarTimeoutRef.current) }
  }, [])

  const elapsed = elapsedSec(state, deck.offset())
  const elapsedLabel = `${state.running ? '' : '⏸ '}${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`

  const progress = useMemo(() => {
    const pos = mainPosition[state.slideIndex]
    if (pos === -1) return 100
    const slideProgress = totalSteps > 0 ? state.step / totalSteps : 0
    return Math.min(100, ((pos - 1 + slideProgress) / mainCount) * 100)
  }, [state.slideIndex, state.step, totalSteps, mainPosition, mainCount])

  if (!currentSlide) return null
  const Component = currentSlide.Component

  return (
    <div className="slide-stage" style={{ ['--safe-bottom' as never]: showTimeline ? '92px' : '48px' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -24 }}
          transition={{ duration: tokens.motion.duration.base, ease: tokens.motion.ease.inOut }}
          className="slide-canvas"
        >
          <Component step={state.step} totalSteps={totalSteps} isActive next={next} prev={prev} />
        </motion.div>
      </AnimatePresence>

      {currentSlide.meta.speaker?.length ? <Speaker who={currentSlide.meta.speaker} /> : null}

      <ProgressBar value={progress} />
      <Footer counter={labels[state.slideIndex]} />

      <AnimatePresence>
        {showTimeline && !gridOpen && !cover && !showHelp && (
          <Timeline visible slides={slides} currentIndex={state.slideIndex} elapsedSec={elapsed} />
        )}
      </AnimatePresence>

      <AnimatePresence>{showNotes && <NotesPanel id={currentSlide.id} meta={currentSlide.meta} key={currentSlide.id} />}</AnimatePresence>

      <AnimatePresence>
        {gridOpen && (
          <GridView slides={slides} labels={labels} currentIndex={state.slideIndex}
            onSelect={(i) => { goToSlide(i); setGridOpen(false) }} />
        )}
      </AnimatePresence>

      <Toolbar
        visible={showToolbar && !gridOpen && !cover && !showHelp}
        slideIndex={state.slideIndex}
        slideCount={slides.length}
        step={state.step}
        totalSteps={totalSteps}
        elapsed={elapsedLabel}
        onPrev={prev}
        onNext={next}
        canPrev={state.slideIndex > 0 || state.step > 0}
        canNext={state.slideIndex < slides.length - 1 || state.step < totalSteps}
        onHelp={() => setShowHelp(true)}
      />

      <AnimatePresence>
        {cover && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: tokens.motion.duration.fast }} onClick={() => setCover(null)}
            style={{ position: 'fixed', inset: 0, background: cover === 'black' ? '#000' : '#fff', zIndex: 400, cursor: 'none' }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} unlocked={isAdmin} pilotToken={deck.pilotToken} origin={deck.origin} onUnlock={onUnlock} />}
      </AnimatePresence>
    </div>
  )
}
