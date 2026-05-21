import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const r = size * 0.22 // corner radius

  // ── Background — dark rounded square ──────────────────────────────
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()

  // Gradient dark
  const bg = ctx.createLinearGradient(0, 0, size * 0.6, size)
  bg.addColorStop(0, '#1C1C2E')
  bg.addColorStop(1, '#0C0C10')
  ctx.fillStyle = bg
  ctx.fill()

  // ── Lime accent glow ──────────────────────────────────────────────
  const glow = ctx.createRadialGradient(size * 0.5, size * 0.42, 0, size * 0.5, size * 0.42, size * 0.55)
  glow.addColorStop(0, 'rgba(200,255,0,0.12)')
  glow.addColorStop(1, 'rgba(200,255,0,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.moveTo(r, 0); ctx.lineTo(size - r, 0); ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r); ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size); ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.closePath()
  ctx.fill()

  // ── Thin lime border ─────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(200,255,0,0.25)'
  ctx.lineWidth = size * 0.012
  ctx.beginPath()
  ctx.moveTo(r, 0); ctx.lineTo(size - r, 0); ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r); ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size); ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.closePath()
  ctx.stroke()

  // ── "PA" white + "SS" lime ────────────────────────────────────────
  const fontSize = size * 0.38
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `800 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`

  // Mesurer "PA" et "SS" séparément pour les positionner côte à côte
  const paMetrics = ctx.measureText('PA')
  const ssMetrics = ctx.measureText('SS')
  const totalW = paMetrics.width + ssMetrics.width
  const startX = (size - totalW) / 2
  const midY = size * 0.5

  ctx.textAlign = 'left'
  ctx.fillStyle = '#F0F0F8'
  ctx.fillText('PA', startX, midY)

  ctx.fillStyle = '#C8FF00'
  ctx.fillText('SS', startX + paMetrics.width, midY)

  // ── Lime underline dot under "SS" ────────────────────────────────
  const dotR = size * 0.032
  const dotY = midY + fontSize * 0.62
  const dotX = startX + paMetrics.width + ssMetrics.width / 2
  ctx.beginPath()
  ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2)
  ctx.fillStyle = '#C8FF00'
  ctx.fill()

  return canvas.toBuffer('image/png')
}

try {
  mkdirSync(publicDir, { recursive: true })
  writeFileSync(join(publicDir, 'icon-192.png'), drawIcon(192))
  writeFileSync(join(publicDir, 'icon-512.png'), drawIcon(512))
  writeFileSync(join(publicDir, 'apple-touch-icon.png'), drawIcon(180))
  console.log('✓ Icons generated: icon-192.png, icon-512.png, apple-touch-icon.png')
} catch (err) {
  console.error('Error generating icons:', err.message)
  process.exit(1)
}
