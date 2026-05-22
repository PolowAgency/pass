import type { Options } from 'canvas-confetti'

type ConfettiType = 'correct' | 'perfect' | 'levelup' | 'badge' | 'streak'

async function fire(options: Options) {
  if (typeof window === 'undefined') return
  const confetti = (await import('canvas-confetti')).default
  confetti(options)
}

export async function celebrate(type: ConfettiType) {
  if (typeof window === 'undefined') return
  const confetti = (await import('canvas-confetti')).default

  if (type === 'correct') {
    confetti({
      particleCount: 30,
      angle: 90,
      spread: 55,
      origin: { x: 0.5, y: 0.65 },
      colors: ['#C8FF00', '#AAFF00'],
      gravity: 1.2,
      scalar: 0.7,
      ticks: 60,
    })
    return
  }

  if (type === 'perfect' || type === 'levelup') {
    const count = type === 'perfect' ? 120 : 80
    await Promise.all([
      fire({ particleCount: count / 2, angle: 60,  spread: 70, origin: { x: 0,   y: 0.6 }, colors: ['#C8FF00', '#3CEFFF', '#FF3CAC'] }),
      fire({ particleCount: count / 2, angle: 120, spread: 70, origin: { x: 1,   y: 0.6 }, colors: ['#C8FF00', '#FB923C', '#A78BFA'] }),
    ])
    // Centre burst
    confetti({
      particleCount: 40,
      spread: 360,
      startVelocity: 20,
      origin: { x: 0.5, y: 0.5 },
      gravity: 0.5,
      scalar: 1.2,
      colors: ['#C8FF00'],
    })
    return
  }

  if (type === 'badge') {
    confetti({
      particleCount: 60,
      spread: 90,
      origin: { x: 0.5, y: 0.4 },
      colors: ['#A78BFA', '#C8FF00', '#3CEFFF'],
      scalar: 0.9,
      ticks: 80,
    })
    return
  }

  if (type === 'streak') {
    confetti({
      particleCount: 50,
      angle: 90,
      spread: 45,
      origin: { x: 0.5, y: 0.7 },
      colors: ['#FB923C', '#C8FF00', '#FFF'],
      scalar: 0.8,
    })
  }
}
