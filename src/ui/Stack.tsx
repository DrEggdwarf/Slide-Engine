import { ReactNode, CSSProperties } from 'react'

interface StackProps {
  children: ReactNode
  gap?: number
  align?: 'start' | 'center' | 'end' | 'stretch'
  direction?: 'column' | 'row'
  style?: CSSProperties
}

const alignMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
}

export function Stack({ children, gap = 24, align = 'center', direction = 'column', style }: StackProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction,
        gap,
        alignItems: alignMap[align],
        justifyContent: alignMap[align],
        ...style,
      }}
    >
      {children}
    </div>
  )
}
