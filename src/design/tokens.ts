export const tokens = {
  color: {
    text: {
      primary: '#0a0a0a',
      secondary: '#262626',
      tertiary: '#525252',
      muted: '#a3a3a3',
    },
    surface: {
      base: '#ffffff',
      subtle: '#f5f5f5',
      line: '#d4d4d4',
      lineStrong: '#a3a3a3',
    },
    accent: {
      blue: '#1d4ed8',
      red: '#b91c1c',
      teal: '#0f766e',
      violet: '#7c3aed',
    },
    semantic: {
      critical: '#b91c1c',
      warning: '#b45309',
      success: '#15803d',
      info: '#1d4ed8',
      neutral: '#262626',
    },
  },
  type: {
    family: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      mono: '"JetBrains Mono", "IBM Plex Mono", monospace',
    },
    size: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      md: '18px',
      lg: '22px',
      xl: '28px',
      '2xl': '36px',
      '3xl': '52px',
      '4xl': '72px',
      '5xl': '104px',
      '6xl': '144px',
    },
    weight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    leading: {
      tight: 1.05,
      snug: 1.25,
      normal: 1.5,
      relaxed: 1.7,
    },
    tracking: {
      tighter: '-0.04em',
      tight: '-0.02em',
      normal: '0',
      wide: '0.04em',
      wider: '0.12em',
    },
  },
  space: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '24px',
    6: '32px',
    7: '48px',
    8: '64px',
    9: '96px',
    10: '128px',
    11: '160px',
  },
  motion: {
    duration: {
      fast: 0.2,
      base: 0.45,
      slow: 0.7,
      slower: 1.0,
    },
    ease: {
      out: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
      spring: [0.34, 1.2, 0.64, 1] as [number, number, number, number],
    },
  },
} as const

export type Tokens = typeof tokens
