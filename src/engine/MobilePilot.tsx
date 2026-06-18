import { useEffect, useRef, useState } from 'react'
import type { SlideModule } from './types'
import { useDeck, elapsedSec } from './sync'
import { config, speakerColor } from '../presentation.config'

const MONO = "'JetBrains Mono', ui-monospace, monospace"
const SANS = "system-ui, -apple-system, sans-serif"
const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(Math.abs(s) % 60).toString().padStart(2, '0')}`

// thème clair (lisible en plein jour sur un téléphone)
const BG = '#eceff3'
const CARD = '#ffffff'
const LINE = '#e2e6ec'
const TXT = '#10141b'
const MUT = '#6b7280'
const OKC = '#15803d'
const LOCK = '#94a3b8'
const ALL = '#6366f1' // couleur « tout le monde »

const TEAM = Object.keys(config.speakers)

// Speakers d'une slide ; tableau vide = « tout le monde » (n'importe qui peut avancer).
const spk = (m?: SlideModule): string[] => m?.meta.speaker ?? []
const isAll = (m?: SlideModule): boolean => spk(m).length === 0

/* aperçu de slide (mis à l'échelle pour tenir dans sa boîte, non interactif) */
function Preview({ mod, step }: { mod?: SlideModule; step: number }) {
  const [box, setBox] = useState({ w: 320, h: 200 })
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  const scale = Math.min(box.w / 1280, box.h / 800) || 0.001
  return (
    <div ref={ref} style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', border: `1px solid ${LINE}`, background: '#fff', position: 'relative' }}>
      {mod && (
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 1280, height: 800, transform: `translate(-50%, -50%) scale(${scale})`, pointerEvents: 'none' }}>
          <div style={{ width: '100%', height: '100%', padding: '36px 72px 42px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <mod.Component step={step} totalSteps={mod.meta.steps ?? 0} isActive={false} next={() => {}} prev={() => {}} />
          </div>
        </div>
      )}
    </div>
  )
}

/* lineup horizontal : qui parle maintenant + les prochains relais ; encart « TOI » sur mes slides */
function Lineup({ slides, idx, mine }: { slides: SlideModule[]; idx: number; mine: string }) {
  const items: number[] = []
  for (let i = idx; i < Math.min(slides.length, idx + 5); i++) items.push(i)
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {items.map((i) => {
        const sp = spk(slides[i])
        const all = sp.length === 0
        const col = all ? ALL : speakerColor(sp[0])
        const label = all ? 'TOUS' : (sp.length > 1 ? `${sp[0]}+${sp.length - 1}` : sp[0])
        const cur = i === idx
        const me = all || sp.includes(mine)
        return (
          <div key={i} style={{ position: 'relative', flex: '1 1 0', minWidth: 0, padding: '5px 4px', borderRadius: 9, textAlign: 'center', background: cur ? col : `${col}12`, border: `1.5px solid ${cur ? col : me ? `${col}aa` : `${col}33`}`, boxShadow: me && !cur ? `inset 0 0 0 1.5px ${col}` : 'none' }}>
            {me && <span style={{ position: 'absolute', top: -6, right: -3, fontFamily: MONO, fontSize: 7, fontWeight: 800, letterSpacing: 0.3, color: '#fff', background: cur ? 'rgba(0,0,0,0.45)' : col, borderRadius: 6, padding: '1px 4px' }}>TOI</span>}
            <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 0.4, color: cur ? 'rgba(255,255,255,0.9)' : MUT }}>{cur ? 'MAINTENANT' : `+${i - idx}`}</div>
            <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 800, color: cur ? '#fff' : col, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
          </div>
        )
      })}
    </div>
  )
}

export function MobilePilot({ slides }: { slides: SlideModule[] }) {
  const token = new URLSearchParams(window.location.search).get('t')
  const deck = useDeck({ role: 'pilot', token })
  const { state } = deck
  const [me, setMe] = useState<string | null>(null)
  const [override, setOverride] = useState(false)
  const [, setTick] = useState(0)
  useEffect(() => { const id = window.setInterval(() => setTick((t) => t + 1), 250); return () => window.clearInterval(id) }, [])

  const pickMe = (w: string) => { setMe(w); deck.iam(w) }

  // navigation calculée ici puis envoyée en absolu
  const next = () => {
    const ts = slides[state.slideIndex]?.meta.steps ?? 0
    if (state.step < ts) deck.setPos(state.slideIndex, state.step + 1)
    else if (state.slideIndex < slides.length - 1) deck.setPos(state.slideIndex + 1, 0)
  }
  const prev = () => {
    if (state.step > 0) deck.setPos(state.slideIndex, state.step - 1)
    else if (state.slideIndex > 0) deck.setPos(state.slideIndex - 1, slides[state.slideIndex - 1]?.meta.steps ?? 0)
  }

  // ── États d'accès ────────────────────────────────────────────
  if (!token) return <Shell><Msg title="Lien invalide" body="Scanne le QR depuis l'écran du présentateur." /></Shell>
  if (deck.denied) return <Shell><Msg title="Accès refusé" body="Le lien a expiré ou n'est plus valide. Demande un nouveau QR." /></Shell>
  if (deck.granted !== 'pilot') return <Shell><Msg title="Connexion…" body="Mise en relation avec la présentation." /></Shell>

  // ── Choix du speaker ─────────────────────────────────────────
  if (!me) {
    return (
      <Shell>
        <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', fontFamily: SANS, fontSize: 22, fontWeight: 800, color: TXT }}>Qui es-tu&nbsp;?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {TEAM.map((w) => {
              const color = speakerColor(w); const taken = deck.roster.includes(w)
              return (
                <button key={w} onClick={() => pickMe(w)}
                  style={{ padding: '22px 12px', borderRadius: 16, border: `2px solid ${color}`, background: CARD, cursor: 'pointer' }}>
                  <span style={{ display: 'block', color, fontFamily: SANS, fontSize: 18, fontWeight: 800 }}>{w}</span>
                  {taken && <span style={{ fontFamily: MONO, fontSize: 10, color: MUT }}>déjà connecté</span>}
                </button>
              )
            })}
          </div>
        </div>
      </Shell>
    )
  }

  // ── Console live ─────────────────────────────────────────────
  const cur = slides[state.slideIndex]
  const mine = me
  const myColor = speakerColor(mine)
  const curAll = isAll(cur)
  const curNames = curAll ? 'tout le monde' : spk(cur).join(' + ')
  const naturallyActive = curAll || spk(cur).includes(mine)
  const active = override || naturallyActive

  let upIn = -1
  for (let i = state.slideIndex + 1; i < slides.length; i++) { if (isAll(slides[i]) || spk(slides[i]).includes(mine)) { upIn = i - state.slideIndex; break } }

  const elapsed = elapsedSec(state, deck.offset())
  const durs = slides.map((s) => s.meta.duration ?? 60)
  const starts: number[] = []; durs.reduce((a, d, i) => { starts[i] = a; return a + d }, 0)
  const remaining = (starts[state.slideIndex] ?? 0) + (durs[state.slideIndex] ?? 0) - elapsed
  const onTime = remaining >= 0
  const mainTotal = slides.filter((s) => !s.meta.annexe).length
  const mainNo = slides.slice(0, state.slideIndex + 1).filter((s) => !s.meta.annexe).length

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, color: TXT, fontFamily: SANS, display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px calc(10px + env(safe-area-inset-bottom))', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: MONO, fontSize: 12 }}>
        <span style={{ color: MUT }}>SLIDE <b style={{ color: TXT }}>{String(mainNo).padStart(2, '0')}/{mainTotal}</b>{(cur?.meta.steps ?? 0) > 0 ? ` · étape ${state.step}/${cur?.meta.steps}` : ''}</span>
        <span style={{ color: onTime ? OKC : '#b91c1c', fontWeight: 700 }}>{fmt(elapsed)} · {onTime ? `reste ${fmt(remaining)}` : `+${fmt(-remaining)}`}</span>
      </div>

      <div style={{ flex: '0 0 auto' }}><Lineup slides={slides} idx={state.slideIndex} mine={mine} /></div>

      <div style={{ flex: '0 0 auto' }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: MUT, marginBottom: 4 }}>À L'ÉCRAN · {curNames}</div>
        <div style={{ width: '100%', aspectRatio: '16 / 9' }}><Preview mod={cur} step={state.step} /></div>
      </div>

      <div style={{ flex: '1 1 auto', minHeight: 48, background: CARD, border: `1px solid ${LINE}`, borderRadius: 11, padding: '9px 12px', overflow: 'auto' }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: MUT, marginBottom: 4 }}>TES NOTES</div>
        <div style={{ fontSize: 15, lineHeight: 1.5 }}>{cur?.meta.notes || <span style={{ color: MUT }}>—</span>}</div>
      </div>

      {/* ── BLOC DE CONTRÔLE ── */}
      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderRadius: 11, background: active ? `${OKC}14` : '#f1f5f9', border: `1.5px solid ${active ? OKC : LINE}` }}>
          {active ? (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: OKC }} />
                <span style={{ fontWeight: 800, color: OKC, fontFamily: SANS, fontSize: 15 }}>C'EST À TOI</span>
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: MUT }}>{override && !naturallyActive ? 'main forcée' : 'tu pilotes'}</span>
            </>
          ) : (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock color={MUT} />
                <span style={{ fontFamily: SANS, fontSize: 13, color: MUT }}>en main : <b style={{ color: TXT }}>{curNames}</b></span>
              </span>
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: myColor }}>{upIn > 0 ? `à toi dans ${upIn}` : 'en écoute'}</span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 9 }}>
          <button onClick={prev} style={{ flex: 1, padding: 15, borderRadius: 13, border: `1px solid ${LINE}`, background: '#f8fafc', color: TXT, fontSize: 20, fontWeight: 700 }}>←</button>
          <button onClick={() => active && next()} disabled={!active}
            style={{ flex: 3, padding: 15, borderRadius: 13, border: 'none', background: active ? OKC : '#e2e8f0', color: active ? '#fff' : LOCK, fontSize: 19, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {!active && <Lock color={LOCK} />} SUIVANT →
          </button>
        </div>

        {!active && (
          <button onClick={() => setOverride(true)} style={{ width: '100%', padding: 9, borderRadius: 10, border: `1px dashed ${LINE}`, background: 'transparent', color: MUT, fontFamily: MONO, fontSize: 12 }}>
            Prendre la main quand même
          </button>
        )}
        {override && !naturallyActive && (
          <button onClick={() => setOverride(false)} style={{ width: '100%', padding: 9, borderRadius: 10, border: `1px solid ${OKC}55`, background: `${OKC}10`, color: OKC, fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>
            Main forcée — rendre la main
          </button>
        )}

        <div style={{ display: 'flex', gap: 9 }}>
          <button onClick={deck.toggleTimer} style={miniBtn}>{state.running ? 'Pause chrono' : 'Reprendre'}</button>
          <button onClick={deck.resetTimer} style={miniBtn}>Chrono → 0 (tous)</button>
        </div>
      </div>
    </div>
  )
}

const miniBtn = { flex: 1, padding: 9, borderRadius: 10, border: `1px solid ${LINE}`, background: '#f8fafc', color: MUT, fontFamily: MONO, fontSize: 12 } as const

function Msg({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 320 }}>
      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 3, color: MUT }}>RÉGIE · {config.brand.toUpperCase()}</div>
      <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 800, margin: '8px 0 6px', color: TXT }}>{title}</div>
      <div style={{ fontFamily: SANS, fontSize: 15, color: MUT, lineHeight: 1.5 }}>{body}</div>
    </div>
  )
}

function Lock({ color }: { color: string }) {
  return (
    <svg width={13} height={15} viewBox="0 0 14 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x={2} y={6.5} width={10} height={8} rx={1.5} fill={color} />
      <path d="M4 6.5V4.5a3 3 0 0 1 6 0v2" stroke={color} strokeWidth={1.6} />
    </svg>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div style={{ position: 'fixed', inset: 0, background: BG, color: TXT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box' }}>{children}</div>
}
