import { SlideContext, SlideMeta } from '../engine/types'
import { Stack } from '../ui/Stack'
import { Eyebrow } from '../ui/Eyebrow'
import { Headline } from '../ui/Headline'
import { Lede } from '../ui/Lede'

export const meta: SlideMeta = {
  title: 'Titre',
  duration: 30,
  speaker: ['Alice', 'Bob'],
  notes: "Slide d'ouverture : annoncez le sujet et présentez-vous.",
}

export function Component(_: SlideContext) {
  return (
    <Stack gap={28}>
      <Eyebrow>Votre contexte · Date</Eyebrow>
      <Headline size="huge">Titre de la présentation</Headline>
      <Lede>Une phrase d'accroche en une ligne.</Lede>
    </Stack>
  )
}
