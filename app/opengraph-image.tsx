import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PASS — Tu uploads ton cours. On s\'occupe du reste.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0C0C10',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial Black, sans-serif',
          position: 'relative',
        }}
      >
        {/* Lime glow orb */}
        <div style={{
          position: 'absolute',
          top: -120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,255,0,0.12) 0%, transparent 70%)',
        }} />

        {/* Logo badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          borderRadius: 28,
          background: '#161620',
          border: '2px solid rgba(200,255,0,0.2)',
          marginBottom: 40,
          boxShadow: '0 0 60px rgba(200,255,0,0.15)',
        }}>
          <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: -2, display: 'flex' }}>
            <span style={{ color: '#F0F0F8' }}>PA</span>
            <span style={{ color: '#C8FF00' }}>SS</span>
          </span>
        </div>

        {/* Main title */}
        <div style={{ display: 'flex', fontSize: 88, fontWeight: 900, letterSpacing: -3, marginBottom: 24 }}>
          <span style={{ color: '#F0F0F8' }}>PA</span>
          <span style={{ color: '#C8FF00' }}>SS</span>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 30,
          color: '#6B6B88',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 400,
          letterSpacing: 0,
          margin: 0,
        }}>
          Tu uploads ton cours. On s&apos;occupe du reste.
        </p>

        {/* Bottom badge */}
        <div style={{
          position: 'absolute',
          bottom: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(200,255,0,0.08)',
          border: '1px solid rgba(200,255,0,0.2)',
          borderRadius: 99,
          padding: '10px 28px',
        }}>
          <span style={{ fontSize: 18, color: '#C8FF00', fontWeight: 700 }}>⚡</span>
          <span style={{ fontSize: 18, color: 'rgba(240,240,248,0.6)', fontFamily: 'Arial, sans-serif' }}>
            Fiches IA · QCM · Coach · Révision espacée
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
