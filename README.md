# React Slide Engine

Moteur de présentation React minimaliste — navigation clavier, animations Framer-motion, design system tokenisé.

Conçu pour démarrer une présentation en moins d'une minute : on clone, on installe, on personnalise `presentation.config.ts`, on duplique une slide, on parle.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # bundle de production dans dist/
npm run preview  # servir le build (port 4173)
npm run typecheck
```

## Navigation

| Touche | Action |
|--------|--------|
| `→` `↓` `Espace` `PageDown` | étape suivante / slide suivante |
| `←` `↑` `PageUp` | étape précédente / slide précédente |
| `Home` / `End` | première / dernière slide |
| `g` | grille des slides (sommaire navigable) |
| `s` | notes du présentateur |
| `f` | plein écran (démarrer le diaporama) |
| `b` `.` | écran noir · `w` `,` écran blanc |
| `l` | timeline — jalons de temps par slide (avancer à l'heure) |
| `p` | pause / reprise du chrono |
| `t` | réinitialiser le chrono |
| `?` `h` | panneau d'aide (liste des raccourcis) |
| `Échap` | fermer le panneau actif |

Le bouton `?` de la barre d'outils flottante (visible au survol souris) ouvre le même panneau d'aide.

## Régie temps réel (console & pilotes mobiles)

Trois routes partagent le même état de navigation en direct :

| Route | Rôle |
|-------|------|
| `/` | **Scène** — à projeter. C'est l'autorité : elle exécute les commandes et diffuse l'état. |
| `/console` | **Régie présentateur** sur la même machine (2ᵉ onglet) : aperçu courant + suivant, notes, gros chrono + cadence, timeline cliquable. |
| `/pilote` | **Régie mobile** : un téléphone sur le même réseau, derrière un PIN. |

Synchronisation : `BroadcastChannel` entre `/` et `/console` (même navigateur) ; **WebSocket** (`/sync`) pour les téléphones. La scène rediffuse l'état chaque seconde → tout client en retard converge.

**Brancher un téléphone :** ouvrez `/` puis le panneau d'aide (`h`) — un **QR code** + l'URL (`http://<IP-LAN>:5173/pilote`) + le **PIN** y figurent (aussi affichés sur `/console`). Le QR pré-remplit le PIN. Le PIN se change par variable d'environnement :

```bash
PRESENTER_PIN=1234 npm run dev
```

Sur le pilote, chaque relais choisit son nom (parmi `speakers`). **Relais auto** : seul l'orateur de la slide courante peut avancer (bouton « SUIVANT » vert = « c'est à toi ») ; les autres voient « à toi dans N » et peuvent forcer la main si besoin. Une slide sans `speaker` = « tout le monde » peut avancer. Le chrono (pause / remise à zéro) est **partagé** par toute l'équipe.

> Réseau : le serveur dev écoute sur `0.0.0.0` (`server.host`). Si un pare-feu bloque les autres appareils, autorisez le port (`sudo ufw allow 5173`). Les routes `/console` et `/pilote` reposent sur le fallback SPA du serveur dev ; en production, servez `index.html` pour toutes les routes.

## Architecture

```
src/
├── main.tsx                # Bootstrap React
├── presentation.config.ts  # ★ LE fichier à éditer : marque (brand) + équipe (speakers)
├── design/
│   ├── tokens.ts           # Couleurs, typographie, espacement, motion
│   └── globals.css         # Reset + variables CSS globales
├── engine/
│   ├── Presentation.tsx    # Moteur (scène /) : navigation, layout, transitions, autorité de synchro
│   ├── Console.tsx         # Régie présentateur (/console)
│   ├── MobilePilot.tsx     # Régie mobile (/pilote) — PIN + relais auto
│   ├── deck.ts             # Protocole de synchro (état + commandes)
│   ├── slides.ts           # Auto-découverte des slides — rien à éditer
│   └── types.ts            # SlideMeta, SlideContext, SlideModule
├── ui/                     # Composants réutilisables
│   ├── Eyebrow.tsx         # Petit label en haut de slide
│   ├── Headline.tsx        # Titre principal
│   ├── Lede.tsx            # Paragraphe d'accroche
│   ├── Footer.tsx          # Bandeau bas (marque + compteur de slide)
│   ├── GridView.tsx        # Vue grille / sommaire (touche g)
│   ├── HelpOverlay.tsx     # Panneau d'aide / raccourcis (touche ?)
│   ├── NotesPanel.tsx      # Notes du présentateur (touche s)
│   ├── ProgressBar.tsx     # Barre de progression
│   ├── Reveal.tsx          # Apparition pas à pas
│   ├── Rule.tsx            # Trait de séparation
│   ├── Speaker.tsx         # Pastilles « qui parle »
│   ├── Timeline.tsx        # Timeline de répétition (touche l)
│   ├── Stack.tsx           # Layout flex column/row avec gap
│   ├── Stat.tsx            # Chiffre clé en grand
│   └── Toolbar.tsx         # Barre d'outils flottante
└── slides/                 # UNIQUEMENT vos slides — une slide = un fichier
    ├── 01-titre.tsx        # l'ordre = ordre alphabétique du nom de fichier
    ├── 02-points.tsx
    └── …
```

## Créer une slide

Une slide est un module qui exporte deux choses : `meta` (description) et `Component` (rendu React).

```tsx
// src/slides/06-ma-slide.tsx
import { SlideContext, SlideMeta } from '../engine/types'
import { tokens } from '../design/tokens'
import { Eyebrow } from '../ui/Eyebrow'
import { Stack } from '../ui/Stack'

export const meta: SlideMeta = {
  title: 'Ma slide',           // titre court affiché dans la grille (g)
  speaker: ['Alice'],          // qui parle — noms définis dans presentation.config.ts
  duration: 90,                // durée cible (s) : jalons timeline (l) + cadence console/pilote
  notes: 'Notes du présentateur (touche s).',
  // steps: 3,                 // optionnel : nombre de révélations internes (→)
  // annexe: true,             // optionnel : slide de réserve (Q&A)
}
// Pas d'`id` : il est dérivé du nom de fichier (06-ma-slide.tsx → '06-ma-slide').

export function Component(_: SlideContext) {
  return (
    <Stack gap={32} align="start">
      <Eyebrow>Section 1</Eyebrow>
      <h2 style={{
        fontSize: tokens.type.size['2xl'],
        color: tokens.color.text.primary,
      }}>
        Mon titre
      </h2>
    </Stack>
  )
}
```

**C'est tout.** Aucune inscription manuelle : le moteur découvre automatiquement chaque
`.tsx` du dossier `src/slides/`. Déposez le fichier, il apparaît dans la présentation ;
modifiez son `meta`, c'est répercuté immédiatement (hot reload en dev).

- **Ordre** = ordre **alphabétique** du nom de fichier. Préfixez par `01-`, `02-`, … et
  **zéro-paddez** au-delà de 9 (`08-`, `09-`, `10-`) — sinon `10-x` passerait avant `2-x`.
- **`id`** = le nom du fichier sans `.tsx` (`01-titre.tsx` → `01-titre`), géré tout seul.
- **Helpers / partials** : un fichier dont le nom commence par `_` (ex. `_layout.tsx`) est
  ignoré par l'auto-découverte — pratique pour factoriser du code partagé entre slides.

## Révéler des éléments pas à pas

Une slide peut afficher son contenu en plusieurs temps. On déclare le nombre d'étapes dans `meta.steps`, puis on conditionne l'affichage avec `step` ou le composant `<Reveal>` :

```tsx
export const meta: SlideMeta = {
  steps: 3,
}

export function Component({ step }: SlideContext) {
  return (
    <Stack gap={20}>
      <Reveal show={step >= 1}>Premier point</Reveal>
      <Reveal show={step >= 2}>Deuxième point</Reveal>
      <Reveal show={step >= 3}>Troisième point</Reveal>
    </Stack>
  )
}
```

Les flèches droite / gauche font progresser les étapes avant de passer à la slide suivante.

## Pastilles « qui parle »

Chaque slide peut déclarer qui prend la parole via `meta.speaker`. Le moteur affiche
alors les pastilles colorées correspondantes en haut à gauche, et les reporte dans la grille.

```tsx
// dans le meta d'une slide :
speaker: ['Alice']            // un orateur
speaker: ['Alice', 'Bob']     // plusieurs
```

Les orateurs (nom → couleur) se définissent **une seule fois** dans `src/presentation.config.ts` :

```ts
speakers: {
  Alice: '#1d4ed8',
  Bob:   '#b91c1c',
}
```

La couleur est **optionnelle** : un nom non listé reçoit une couleur stable automatique.
Le nom écrit dans `speaker` est affiché tel quel (en majuscules) sur la pastille.

## Annexes (Q&A)

Une slide marquée `annexe: true` est sortie de la numérotation principale : elle est
étiquetée `Annexe A1`, `A2`… au lieu de `03 / 17`, et **exclue du calcul de progression**.
Pratique pour des slides de réserve / questions placées après la conclusion.

## Design tokens

Tout le système visuel est centralisé dans `src/design/tokens.ts` :

- **`color`** — `text.primary/secondary/tertiary/muted`, `surface.base/subtle/line`, `accent.blue/red/teal/violet`, `semantic.critical/warning/success/info`
- **`type`** — `family.sans/mono`, `size.xs … 6xl`, `weight.light/regular/medium/semibold/bold`, `tracking`, `leading`
- **`space`** — échelle 1 à 10 (4 px → 80 px)
- **`motion`** — `duration.fast/medium/slow`, `ease.in/out/inOut`
- **`radius`**, **`shadow`**, **`zIndex`**

Modifier un token impacte toutes les slides — pas de styles inline disséminés.

## Composants UI

| Composant | Rôle |
|-----------|------|
| `Eyebrow` | Petit label monospace en haut de slide (« Partie 1 », « Section A ») |
| `Headline` | Titre principal de slide |
| `Lede` | Paragraphe d'introduction sous le titre |
| `Stack` | Conteneur flex (column ou row) avec gap |
| `Stat` | Affichage d'un chiffre clé en grand format |
| `Reveal` | Wrapper d'apparition contrôlée par `show: boolean` |
| `Rule` | Trait horizontal de séparation |
| `Speaker` | Pastilles « qui parle » (haut gauche), pilotées par `meta.speaker` |
| `ProgressBar` | Barre de progression de la présentation |
| `Footer` | Bandeau bas : marque (`config.brand`) + compteur de slide |
| `NotesPanel` | Notes du présentateur (`meta.notes`), touche `s` |
| `GridView` | Vue grille / sommaire navigable, touche `g` |
| `HelpOverlay` | Panneau d'aide listant les raccourcis, touche `?` |
| `Toolbar` | Barre d'outils flottante (compteur, navigation) |

## Personnaliser

- **Marque & orateurs** : tout dans `src/presentation.config.ts` — `brand` (bandeau du bas) et `speakers` (noms + couleurs)
- **Police** : remplacer `tokens.type.family.sans` (et charger la police dans `index.html` ou `globals.css`)
- **Format** : la présentation s'adapte au viewport. Pour un 16:9 fixe, contraindre `.slide-canvas` dans `globals.css`.

## Stack technique

- **React 18** + **TypeScript 5**
- **Vite 5** — dev server + build
- **Framer-motion 12** — animations
- Aucune autre dépendance UI

## Licence

[MIT](LICENSE) © 2026 DrEggdwarf — réutilisable librement, y compris en usage commercial.
