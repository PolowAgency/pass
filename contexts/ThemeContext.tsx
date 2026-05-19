'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Theme, Colors, THEMES } from '@/lib/theme'

interface ThemeCtx { theme: Theme; colors: Colors; toggle: () => void }

const Ctx = createContext<ThemeCtx>({ theme: 'dark', colors: THEMES.dark, toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('pass-theme') as Theme | null
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  useEffect(() => {
    const c = THEMES[theme]
    const root = document.documentElement
    // Injecte les valeurs dans les CSS variables → mise à jour instantanée partout
    root.style.setProperty('--bg', c.bg)
    root.style.setProperty('--surface', c.surface)
    root.style.setProperty('--surface2', c.surface2)
    root.style.setProperty('--border', c.border)
    root.style.setProperty('--text', c.text)
    root.style.setProperty('--muted', c.muted)
    document.body.style.background = c.bg
    document.body.style.color = c.text
  }, [theme])

  function toggle() {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      localStorage.setItem('pass-theme', next)
      return next
    })
  }

  return (
    <Ctx.Provider value={{ theme, colors: THEMES[theme], toggle }}>
      <div data-theme={theme}
        style={{ background: THEMES[theme].bg, minHeight: '100vh', transition: 'background 0.25s' }}>
        {children}
      </div>
    </Ctx.Provider>
  )
}

export const useTheme = () => useContext(Ctx)
