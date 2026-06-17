import { SlideContext, SlideMeta } from '../engine/types'
import { Stack } from '../ui/Stack'
import { Eyebrow } from '../ui/Eyebrow'
import { Headline } from '../ui/Headline'
import { Lede } from '../ui/Lede'

export const meta: SlideMeta = {
  title: 'Annexe — réserve',
  annexe: true, // hors numérotation principale → étiquetée « Annexe A1 »
  notes: 'Slide de réserve : exclue de la numérotation et de la progression.',
}

export function Component(_: SlideContext) {
  return (
    <Stack gap={20}>
      <Eyebrow>Annexe</Eyebrow>
      <Headline size="lg">Slide de réserve (hors présentation)</Headline>
      <Lede size="sm">Étiquetée « Annexe A1 », exclue de la barre de progression.</Lede>
    </Stack>
  )
}
