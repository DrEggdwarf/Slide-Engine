import { ComponentType } from 'react'

export interface SlideContext {
  step: number
  totalSteps: number
  isActive: boolean
  next: () => void
  prev: () => void
}

export interface SlideMeta {
  /** Titre court affiché dans la grille / le sommaire (g) */
  title?: string
  /** Qui parle — noms définis dans presentation.config.ts (ex. ['Alice', 'Bob']) */
  speaker?: string[]
  /** Notes du présentateur (touche s) */
  notes?: string
  /** Durée cible en secondes — place les jalons de la timeline (touche l) */
  duration?: number
  /** Nombre de révélations internes (→). Absent ou 0 = pas d'étapes */
  steps?: number
  /** true = slide de réserve (Q&A) : hors numérotation et hors progression */
  annexe?: boolean
}

export interface SlideModule {
  /** Dérivé du nom de fichier (01-titre.tsx → '01-titre') — pas à renseigner */
  id: string
  meta: SlideMeta
  Component: ComponentType<SlideContext>
}
