import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#0C0C10', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🤔</div>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 32, color: '#F0F0F8', letterSpacing: '-0.5px', marginBottom: 8 }}>Page introuvable</h1>
      <p style={{ fontSize: 15, color: '#6B6B88', fontFamily: 'DM Sans, sans-serif', marginBottom: 28 }}>Cette page n&apos;existe pas ou a été déplacée.</p>
      <Link href="/dashboard">
        <button style={{ background: '#C8FF00', color: '#0C0C10', border: 'none', borderRadius: 14, padding: '13px 24px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 0 20px rgba(200,255,0,0.25)' }}>
          Retour au dashboard
        </button>
      </Link>
    </div>
  )
}
