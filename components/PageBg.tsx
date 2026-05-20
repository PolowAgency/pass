'use client'

// Fond atmosphérique partagé — identique à la landing page
export default function PageBg() {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: '#C8FF00', top: -150, left: -150,
          filter: 'blur(120px)', opacity: 0.045,
          animation: 'blobMove 14s ease-in-out infinite alternate',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: '#FF3CAC', top: '30%', right: -100,
          filter: 'blur(120px)', opacity: 0.04,
          animation: 'blobMove 10s ease-in-out infinite alternate',
          animationDelay: '-3s',
        }} />
        <div style={{
          position: 'absolute', width: 450, height: 450, borderRadius: '50%',
          background: '#3CEFFF', bottom: '5%', left: '15%',
          filter: 'blur(120px)', opacity: 0.035,
          animation: 'blobMove 16s ease-in-out infinite alternate',
          animationDelay: '-6s',
        }} />
      </div>
      <style>{`
        @keyframes blobMove {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(40px,-30px) scale(1.05); }
          66%  { transform: translate(-20px,50px) scale(.95); }
          100% { transform: translate(30px,20px) scale(1.08); }
        }
      `}</style>
    </>
  )
}
