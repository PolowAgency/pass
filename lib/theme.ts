export type Theme = 'dark' | 'light'

export interface Colors {
  bg: string; surface: string; surface2: string; border: string; border2: string
  text: string; textSub: string; muted: string
  lime: string; limeDark: string; limeText: string; limeBg: string; limeBorder: string
  pink: string; blue: string; orange: string
  streakBg: string; streakBorder: string; streakText: string
  cardBg: string; cardBorder: string; cardShadow: string
  navActiveBg: string; navActiveBorder: string; navActiveColor: string; navActiveText: string; navDot: string
  topbarBg: string; topbarBorder: string
  inputBg: string; inputBorder: string
  btnShadow: string
  score80: string; score50: string; score30: string; score0: string
  tagFn: (color: string) => string
}

export const DARK: Colors = {
  bg:        '#0C0C10',
  surface:   '#14141A',
  surface2:  '#1E1E28',
  border:    '#2A2A38',
  border2:   '#3A3A48',
  text:      '#F0F0F8',
  textSub:   'rgba(240,240,248,0.65)',
  muted:     '#6B6B88',

  lime:      '#C8FF00',
  limeDark:  '#8AAB00',
  limeText:  '#0C0C10',
  limeBg:    'rgba(200,255,0,0.1)',
  limeBorder:'rgba(200,255,0,0.25)',

  pink:      '#FF3CAC',
  blue:      '#3CEFFF',
  orange:    '#FB923C',

  streakBg:    'rgba(251,146,60,0.1)',
  streakBorder:'rgba(251,146,60,0.2)',
  streakText:  '#FB923C',

  cardBg:    '#14141A',
  cardBorder:'#2A2A38',
  cardShadow:'0 3px 0 #080810',

  navActiveBg:    'rgba(200,255,0,0.1)',
  navActiveBorder:'rgba(200,255,0,0.25)',
  navActiveColor: '#C8FF00',
  navActiveText:  '#C8FF00',
  navDot:         '#C8FF00',

  topbarBg:    'rgba(12,12,16,0.95)',
  topbarBorder:'#1E1E28',

  inputBg:    '#1E1E28',
  inputBorder:'#2A2A38',

  btnShadow: '0 4px 0 #8AAB00',

  score80: '#4ade80', score50: '#C8FF00', score30: '#FB923C', score0: '#f87171',

  tagFn: (color: string) => `${color}18`,
}

// ── Warm Paper ────────────────────────────────────────────────────────────────
// Fond blanc chaud (papier qualité), accents saturés lisibles, ombres douces
export const LIGHT: Colors = {
  bg:        '#F9F9F4',      // blanc crème — jamais froid
  surface:   '#FFFFFF',
  surface2:  '#F0F0EA',      // légèrement chaud
  border:    '#E0E0D4',      // warm border, presque invisible
  border2:   '#C4C4B4',      // shadow tone — warm

  text:      '#18180E',      // presque noir, légèrement chaud
  textSub:   'rgba(24,24,14,0.6)',
  muted:     '#7A7A6A',      // warm muted (fini le gris froid)

  // Lime — même couleur, mais dark beaucoup plus foncé pour lisibilité sur blanc
  lime:      '#C8FF00',
  limeDark:  '#4A7400',      // vert foncé → contraste AAA sur blanc
  limeText:  '#0A1200',      // texte sur bouton lime
  limeBg:    '#ECFFAA',      // fond lime plus saturé = plus visible
  limeBorder:'#9ECB00',      // bordure lime visible sur blanc

  // Accents assombris pour lisibilité sur fond clair
  pink:      '#C2005A',      // rose foncé (était #FF3CAC neon inutilisable)
  blue:      '#0069A0',      // bleu marine lisible (était #3CEFFF invisible)
  orange:    '#C05200',      // orange brûlé lisible (était #FB923C trop clair)

  streakBg:    '#FFF3E8',
  streakBorder:'#EDAA55',
  streakText:  '#B84400',    // orange foncé lisible

  cardBg:    '#FFFFFF',
  cardBorder:'#E0E0D4',
  cardShadow:'0 4px 0 #C4C4B4, 0 1px 12px rgba(0,0,0,0.06)',

  navActiveBg:    '#ECFFAA',
  navActiveBorder:'#9ECB00',
  navActiveColor: '#3A6000',
  navActiveText:  '#3A6000',
  navDot:         '#4A7400',

  topbarBg:    'rgba(249,249,244,0.96)',
  topbarBorder:'#E0E0D4',

  inputBg:    '#FFFFFF',
  inputBorder:'#D8D8CC',

  btnShadow: '0 4px 0 #4A7400',

  score80: '#166534', score50: '#4A7400', score30: '#B84400', score0: '#B91C1C',

  tagFn: (color: string) => `${color}22`,
}

export const THEMES: Record<Theme, Colors> = { dark: DARK, light: LIGHT }
