// Génère des sons de jeu via Web Audio API — zéro fichier MP3, zéro dépendance
type SoundType = 'correct' | 'wrong' | 'levelup' | 'badge' | 'streak' | 'perfect'

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  } catch { return null }
}

function tone(ctx: AudioContext, freq: number, start: number, duration: number, gain = 0.18, type: OscillatorType = 'sine') {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.connect(g)
  g.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
  g.gain.setValueAtTime(0, ctx.currentTime + start)
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration)
}

const SOUNDS: Record<SoundType, (ctx: AudioContext) => void> = {
  correct: (ctx) => {
    tone(ctx, 523, 0,    0.12)  // Do
    tone(ctx, 659, 0.08, 0.18)  // Mi
  },
  wrong: (ctx) => {
    tone(ctx, 220, 0,    0.08, 0.12, 'sawtooth')
    tone(ctx, 180, 0.06, 0.14, 0.10, 'sawtooth')
  },
  levelup: (ctx) => {
    tone(ctx, 392, 0,    0.1)   // Sol
    tone(ctx, 523, 0.1,  0.1)   // Do
    tone(ctx, 659, 0.2,  0.1)   // Mi
    tone(ctx, 784, 0.3,  0.25)  // Sol haut
  },
  badge: (ctx) => {
    tone(ctx, 880, 0,    0.08, 0.15)
    tone(ctx, 1108, 0.07, 0.08, 0.13)
    tone(ctx, 1319, 0.14, 0.15, 0.12)
  },
  streak: (ctx) => {
    tone(ctx, 440, 0,    0.1,  0.15)
    tone(ctx, 554, 0.08, 0.1,  0.15)
    tone(ctx, 659, 0.16, 0.18, 0.15)
  },
  perfect: (ctx) => {
    tone(ctx, 523, 0,    0.08, 0.15)
    tone(ctx, 659, 0.07, 0.08, 0.15)
    tone(ctx, 784, 0.14, 0.08, 0.15)
    tone(ctx, 1047, 0.21, 0.3,  0.18)
    // Sparkle final
    tone(ctx, 1568, 0.35, 0.15, 0.08, 'triangle')
    tone(ctx, 1976, 0.42, 0.15, 0.06, 'triangle')
  },
}

export function playSound(type: SoundType) {
  const ctx = getCtx()
  if (!ctx) return
  try { SOUNDS[type]?.(ctx) } catch { /* silent fail */ }
}
