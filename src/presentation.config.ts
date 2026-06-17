// ─────────────────────────────────────────────────────────────────────────
//  Le seul fichier à éditer pour personnaliser la présentation.
// ─────────────────────────────────────────────────────────────────────────

export const config = {
  // Bandeau affiché en bas de chaque slide.
  brand: 'React Slide Engine',

  // Votre équipe : un nom → une couleur. Référencez ces noms dans `meta.speaker`,
  // ex. `speaker: ['Alice', 'Bob']`. La couleur est optionnelle : un nom absent
  // d'ici reçoit automatiquement une couleur stable. (Exemples à remplacer.)
  speakers: {
    Alice: '#1d4ed8',
    Bob: '#b91c1c',
  } as Record<string, string>,
}

// Palette de secours pour les orateurs sans couleur définie.
const FALLBACK = ['#1d4ed8', '#b91c1c', '#0f766e', '#7c3aed', '#b45309', '#0369a1']

export function speakerColor(name: string): string {
  const defined = config.speakers[name]
  if (defined) return defined
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return FALLBACK[h % FALLBACK.length]
}
