import { SlideContext, SlideMeta } from '../engine/types'
import { Stack } from '../ui/Stack'
import { Eyebrow } from '../ui/Eyebrow'
import { Headline } from '../ui/Headline'
import { Reveal } from '../ui/Reveal'
import { tokens } from '../design/tokens'

export const meta: SlideMeta = {
  title: 'Points clés',
  speaker: ['Alice'],
  steps: 3, // 3 révélations : → pour faire apparaître chaque point
  notes: 'Révélez chaque point avec →. `step` (0→3) pilote l\'affichage.',
}

const POINTS = ['Premier point', 'Deuxième point', 'Troisième point']

export function Component({ step }: SlideContext) {
  return (
    <Stack gap={28} align="start" style={{ width: '100%', maxWidth: 820 }}>
      <Eyebrow>Section</Eyebrow>
      <Headline size="lg" align="left">
        Un titre de section
      </Headline>
      <Stack gap={16} align="start">
        {POINTS.map((p, i) => (
          <Reveal key={p} show={step >= i + 1}>
            <span style={{ fontSize: tokens.type.size.lg, color: tokens.color.text.secondary }}>
              · {p}
            </span>
          </Reveal>
        ))}
      </Stack>
    </Stack>
  )
}
