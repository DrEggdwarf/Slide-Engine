import { ComponentType } from 'react'
import { SlideContext, SlideMeta, SlideModule } from './types'

// Auto-découverte : chaque .tsx de src/slides/ exportant `meta` + `Component`
// devient une slide — rien à enregistrer. L'`id` vient du nom de fichier et
// l'ordre suit l'ordre alphabétique (préfixez par 01-, 02-, …).
// Les fichiers `_xxx.tsx` sont ignorés (helpers / partials partagés).
const modules = import.meta.glob('../slides/*.tsx', { eager: true }) as Record<
  string,
  { meta?: SlideMeta; Component?: ComponentType<SlideContext> }
>

export const slides: SlideModule[] = Object.entries(modules)
  .filter(([path]) => !path.split('/').pop()!.startsWith('_'))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, mod]) => ({
    id: path.split('/').pop()!.replace(/\.tsx$/, ''),
    meta: mod.meta ?? {},
    Component: mod.Component as ComponentType<SlideContext>,
  }))
