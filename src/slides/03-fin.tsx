import { SlideContext, SlideMeta } from '../engine/types'
import { Stack } from '../ui/Stack'
import { Headline } from '../ui/Headline'
import { Lede } from '../ui/Lede'

export const meta: SlideMeta = {
  title: 'Fin',
  duration: 30,
  speaker: ['Alice', 'Bob'],
  notes: 'Remerciez et ouvrez les questions.',
}

export function Component(_: SlideContext) {
  return (
    <Stack gap={20}>
      <Headline size="huge">Merci</Headline>
      <Lede>Questions ?</Lede>
    </Stack>
  )
}
