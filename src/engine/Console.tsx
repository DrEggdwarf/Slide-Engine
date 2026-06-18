import { memo, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { SlideModule } from './types'
import { useDeck, elapsedSec } from './sync'
import { tokens } from '../design/tokens'
import { config, speakerColor } from '../presentation.config'

const MONO = tokens.type.family.mono
const SANS = tokens.type.family.sans
const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(Math.abs(s) % 60).toString().padStart(2, '0')}`

const BG = '#0f1115'
const PANEL = '#171a21'
const LINE = '#262b36'
const TXT = '#e5e7eb'
const MUT = '#8b93a1'
const OKC = '#22c55e'
const KO = '#ef4444'

/* aperçu d'une slide (rendu mis à l'échelle, non interactif) */
const Preview = memo(function Preview({ mod, step, width }: { mod?: SlideModule; step: number; width: number }) {
  const scale = width / 1280
  const height = Math.round(800 * scale)
  if (!mod) {
    return <div style={{ width, height, borderRadius: 10, border: `1px solid ${LINE}`, background: '#0b0d12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUT, fontFamily: MONO }}>— fin —</div>
  }
  const C = mod.Component
  return (
    <div style={{ width, height, borderRadius: 10, overflow: 'hidden', border: `1px solid ${LINE}`, background: '#fff', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1280, height: 800, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        <div style={{ width: '100%', height: '100%', padding: '36px 72px 42px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <C step={step} totalSteps={mod.meta.steps ?? 0} isActive={false} next={() => {}} prev={() => {}} />
        </div>
      </div>
    </div>
  )
})

function SpeakerTags({ mod }: { mod?: SlideModule }) {
  const list = mod?.meta.speaker ?? []
  return (
    <span style={{ display: 'inline-flex', gap: 10 }}>
      {list.map((name) => {
        const color = speakerColor(name)
        return (
          <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: MONO, fontSize: 12, color }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />{name}
          </span>
        )
      })}
    </span>
  )
}

export function Console({ slides }: { slides: SlideModule[] }) {
  const deck = useDeck({ role: 'stage' })
  const { state } = deck
  const isAdmin = deck.granted === 'admin'
  const [, setTick] = useState(0)
  useEffect(() => { const id = window.setInterval(() => setTick((t) => t + 1), 250); return () => window.clearInterval(id) }, [])

  // navigation calculée ici (on connaît les steps) puis envoyée en absolu
  const next = () => {
    const ts = slides[state.slideIndex]?.meta.steps ?? 0
    if (state.step < ts) deck.setPos(state.slideIndex, state.step + 1)
    else if (state.slideIndex < slides.length - 1) deck.setPos(state.slideIndex + 1, 0)
  }
  const prev = () => {
    if (state.step > 0) deck.setPos(state.slideIndex, state.step - 1)
    else if (state.slideIndex > 0) deck.setPos(state.slideIndex - 1, slides[state.slideIndex - 1]?.meta.steps ?? 0)
  }
  const goto = (i: number) => deck.setPos(i, 0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', ' ', 'ArrowDown', 'PageDown'].includes(e.key)) { e.preventDefault(); next() }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); prev() }
      else if (e.key === 'Home') goto(0)
      else if (e.key === 'End') goto(slides.length - 1)
      else if (e.key === 'p') deck.toggleTimer()
      else if (e.key === 't') deck.resetTimer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const cur = slides[state.slideIndex]
  const nxt = slides[state.slideIndex + 1]
  const elapsed = elapsedSec(state, deck.offset())

  const durs = slides.map((s) => s.meta.duration ?? 60)
  const total = durs.reduce((a, b) => a + b, 0) || 1
  const starts: number[] = []
  durs.reduce((acc, d, i) => { starts[i] = acc; return acc + d }, 0)
  const curEnd = (starts[state.slideIndex] ?? 0) + (durs[state.slideIndex] ?? 0)
  const remaining = curEnd - elapsed
  const ok = remaining >= 0
  const status = ok ? OKC : KO
  const nowFrac = Math.min(1, Math.max(0, elapsed / total))

  const mainTotal = slides.filter((s) => !s.meta.annexe).length
  const mainNo = slides.slice(0, state.slideIndex + 1).filter((s) => !s.meta.annexe).length

  const pilotUrl = deck.pilotToken ? `${deck.origin ?? location.origin}/pilote?t=${deck.pilotToken}` : ''
  const btn = { background: PANEL, border: `1px solid ${LINE}`, color: TXT, borderRadius: 8, padding: '8px 14px', fontFamily: MONO, fontSize: 13, cursor: 'pointer' as const }

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, color: TXT, fontFamily: SANS, display: 'flex', flexDirection: 'column', gap: 14, padding: 22, overflow: 'auto', boxSizing: 'border-box' }}>
      {/* barre haute */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: MUT }}>RÉGIE · {config.brand.toUpperCase()}</span>
          <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700 }}>{String(mainNo).padStart(2, '0')} / {String(mainTotal).padStart(2, '0')}</span>
          {state.step > 0 || (cur?.meta.steps ?? 0) > 0 ? <span style={{ fontFamily: MONO, fontSize: 12, color: MUT }}>étape {state.step}/{cur?.meta.steps ?? 0}</span> : null}
          {!isAdmin && <span style={{ fontFamily: MONO, fontSize: 11, color: KO }}>lecture seule — déverrouille la scène (h)</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontFamily: MONO, fontSize: 40, fontWeight: 700, color: state.running ? TXT : MUT }}>{!state.running && '|| '}{fmt(elapsed)}</span>
          <span style={{ fontFamily: MONO, fontSize: 13, color: MUT }}>/ {fmt(total)}</span>
          <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: status, padding: '4px 10px', borderRadius: 8, background: `${status}1a`, border: `1px solid ${status}55` }}>
            {ok ? `reste ${fmt(remaining)}` : `+${fmt(-remaining)} retard`}
          </span>
        </div>
      </div>

      {/* aperçus courant + suivant */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1, color: OKC }}>● EN COURS</span>
            <SpeakerTags mod={cur} />
          </div>
          <Preview mod={cur} step={state.step} width={560} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1, color: MUT }}>SUIVANT →</span>
            <SpeakerTags mod={nxt} />
          </div>
          <Preview mod={nxt} step={0} width={380} />
        </div>
      </div>

      {/* notes */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 2, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: MUT, marginBottom: 8 }}>NOTES — SLIDE COURANTE</div>
          <div style={{ fontSize: 15, lineHeight: 1.55, color: TXT }}>{cur?.meta.notes || <span style={{ color: MUT }}>—</span>}</div>
        </div>
        <div style={{ flex: 1, background: '#13161c', border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: MUT, marginBottom: 8 }}>NOTES — SUIVANTE</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: MUT }}>{nxt?.meta.notes || '—'}</div>
        </div>
      </div>

      {/* timeline inline (clic = sauter) */}
      <div style={{ position: 'relative', height: 18 }}>
        {slides.map((s, i) => {
          const left = (starts[i] / total) * 100, width = (durs[i] / total) * 100
          const col = s.meta.speaker?.length ? speakerColor(s.meta.speaker[0]) : MUT
          const isCur = i === state.slideIndex, done = i < state.slideIndex
          return (
            <div key={s.id} onClick={() => goto(i)} title={s.meta.title ?? s.id}
              style={{ position: 'absolute', left: `${left}%`, width: `calc(${width}% - 2px)`, top: 0, height: 18, borderRadius: 3, cursor: 'pointer',
                background: isCur ? col : `${col}${done ? '33' : '22'}`, border: isCur ? `1.5px solid ${col}` : `1px solid ${LINE}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: isCur ? '#fff' : MUT }}>{i + 1}</span>
            </div>
          )
        })}
        <div style={{ position: 'absolute', left: `${nowFrac * 100}%`, top: -4, bottom: -4, width: 2, background: status, boxShadow: `0 0 6px ${status}` }} />
      </div>

      {/* contrôles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button style={btn} onClick={prev}>← Précédent</button>
        <button style={{ ...btn, background: '#1e2530', fontWeight: 700 }} onClick={next}>Suivant →</button>
        <span style={{ width: 1, height: 22, background: LINE, margin: '0 4px' }} />
        <button style={btn} onClick={deck.toggleTimer}>{state.running ? 'Pause' : 'Reprendre'}</button>
        <button style={btn} onClick={deck.resetTimer}>Remettre le chrono</button>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: MONO, fontSize: 11, color: MUT }}>← → naviguer · clic sur un jalon = sauter</span>
      </div>

      {pilotUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 10, background: PANEL, border: `1px solid ${LINE}` }}>
          <div style={{ background: '#fff', padding: 6, borderRadius: 6, lineHeight: 0 }}><QRCodeSVG value={pilotUrl} size={66} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: OKC }}>RÉGIE MOBILE — SCANNE POUR PILOTER</span>
            <span style={{ fontFamily: MONO, fontSize: 13, color: TXT, overflowWrap: 'anywhere' }}>{pilotUrl}</span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: MUT }}>Accès à durée limitée — montre-le aux orateurs.</span>
          </div>
        </div>
      )}
    </div>
  )
}
