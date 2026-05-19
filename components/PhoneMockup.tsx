export default function PhoneMockup() {
  return (
    <div style={{ position: 'relative', width: 280, height: 580, flexShrink: 0 }}>
      {/* Ombre sol */}
      <div style={{
        position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
        width: 200, height: 28, borderRadius: '50%',
        background: 'rgba(0,0,0,0.5)', filter: 'blur(20px)', zIndex: 0,
      }} />

      {/* Frame métallique — identique Rezoo */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 46,
        background: 'linear-gradient(160deg,#3c3c3e 0%,#1e1e20 28%,#131313 58%,#1e1e20 100%)',
        border: '1px solid rgba(255,255,255,0.13)',
        boxShadow: `
          inset 0 0 0 1px rgba(255,255,255,0.07),
          4px 4px 0 0 rgba(0,0,0,0.2),
          -1px 0 0 0 rgba(255,255,255,0.04),
          0 0 0 1px rgba(0,0,0,0.9),
          0 40px 100px rgba(0,0,0,0.8),
          0 0 40px rgba(200,255,0,0.06)
        `,
        zIndex: 1,
      }}>
        {/* Bouton mute */}
        <div style={{ position:'absolute', left:-2, top:76, width:2, height:18, background:'linear-gradient(180deg,#2a2a2c,#3e3e40,#2a2a2c)', borderRadius:'2px 0 0 2px' }} />
        {/* Volume + */}
        <div style={{ position:'absolute', left:-2, top:106, width:2, height:22, background:'linear-gradient(180deg,#2a2a2c,#3e3e40,#2a2a2c)', borderRadius:'2px 0 0 2px' }} />
        {/* Volume - */}
        <div style={{ position:'absolute', left:-2, top:140, width:2, height:22, background:'linear-gradient(180deg,#2a2a2c,#3e3e40,#2a2a2c)', borderRadius:'2px 0 0 2px' }} />
        {/* Power */}
        <div style={{ position:'absolute', right:-2, top:120, width:2, height:34, background:'linear-gradient(180deg,#2a2a2c,#3e3e40,#2a2a2c)', borderRadius:'0 2px 2px 0' }} />
      </div>

      {/* Écran */}
      <div style={{
        position: 'absolute', inset: 5, borderRadius: 42,
        background: '#F2F2F7', overflow: 'hidden', zIndex: 2,
      }}>
        {/* Reflet vitre */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none', borderRadius: 42,
          background: 'linear-gradient(128deg,rgba(255,255,255,0.09) 0%,transparent 36%,transparent 64%,rgba(255,255,255,0.02) 100%)',
        }} />

        {/* Dynamic Island */}
        <div style={{
          position:'absolute', top:9, left:'50%', transform:'translateX(-50%)',
          width:76, height:24, background:'#0a0908', borderRadius:16, zIndex:25,
          boxShadow:'0 0 0 1px rgba(255,255,255,0.04)',
        }} />
        {/* Caméra */}
        <div style={{
          position:'absolute', top:13, left:'50%', transform:'translateX(-50%) translateX(20px)',
          width:8, height:8, background:'#181818', borderRadius:'50%', zIndex:26,
          boxShadow:'inset 0 0 0 2px #0c0c0c',
        }} />

        {/* Status bar */}
        <div style={{ height:37, display:'flex', justifyContent:'space-between', alignItems:'flex-end', padding:'0 16px 7px', background:'#1C1C2E' }}>
          <span style={{ fontFamily:'system-ui,sans-serif', fontWeight:600, fontSize:10, color:'rgba(255,255,255,0.8)' }}>9:41</span>
          <div style={{ display:'flex', gap:3, alignItems:'center' }}>
            <svg width="11" height="8" viewBox="0 0 16 11">
              <rect x="0" y="7" width="2.5" height="4" rx="0.8" fill="rgba(255,255,255,0.8)"/>
              <rect x="4.5" y="5" width="2.5" height="6" rx="0.8" fill="rgba(255,255,255,0.8)"/>
              <rect x="9" y="2.5" width="2.5" height="8.5" rx="0.8" fill="rgba(255,255,255,0.8)"/>
              <rect x="13.5" y="0" width="2.5" height="11" rx="0.8" fill="rgba(255,255,255,0.8)"/>
            </svg>
            <div style={{ width:14, height:7, border:'1.2px solid rgba(255,255,255,0.6)', borderRadius:2, position:'relative' }}>
              <div style={{ position:'absolute', left:1.5, top:1, right:3, bottom:1, background:'white', borderRadius:1 }} />
            </div>
          </div>
        </div>

        {/* App header — gradient PASS */}
        <div style={{
          background: 'linear-gradient(135deg, #1C1C2E 0%, #2D1B69 100%)',
          padding: '6px 14px 12px',
        }}>
          {/* Titre fiche */}
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <div style={{
              width:22, height:22, borderRadius:7, background:'rgba(200,255,0,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'system-ui,sans-serif', fontWeight:900, fontSize:10, color:'#C8FF00',
            }}>1</div>
            <span style={{ fontFamily:'system-ui,sans-serif', fontWeight:800, fontSize:11, color:'#F0F0F8' }}>
              Les vices du consentement
            </span>
          </div>
          <p style={{ fontFamily:'system-ui,sans-serif', fontSize:9, color:'rgba(240,240,248,0.6)', lineHeight:1.4, marginBottom:6 }}>
            Vices qui altèrent le consentement et entraînent la nullité relative du contrat.
          </p>
          {/* Mini stats */}
          <div style={{ display:'flex', gap:5 }}>
            {[
              { label:'Maîtrise', val:'87%', color:'#4ade80' },
              { label:'Révisée', val:'3×', color:'#3CEFFF' },
              { label:'J-12', val:'Exam', color:'#FF3CAC' },
            ].map(s => (
              <div key={s.label} style={{ flex:1, background:'rgba(255,255,255,0.07)', borderRadius:6, padding:'4px 3px', textAlign:'center' }}>
                <div style={{ fontFamily:'system-ui,sans-serif', fontSize:7, color:'rgba(240,240,248,0.4)' }}>{s.label}</div>
                <div style={{ fontFamily:'system-ui,sans-serif', fontWeight:800, fontSize:10, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Corps de la fiche — fond blanc iOS */}
        <div style={{ background:'#F2F2F7', padding:'8px 10px', display:'flex', flexDirection:'column', gap:6 }}>

          {/* Concepts clés */}
          <div style={{ background:'#fff', borderRadius:12, padding:'8px 10px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
              <div style={{ width:16, height:16, borderRadius:5, background:'rgba(60,239,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8 }}>★</div>
              <span style={{ fontFamily:'system-ui,sans-serif', fontWeight:700, fontSize:8, color:'#1C1C2E', textTransform:'uppercase', letterSpacing:'0.5px' }}>Concepts clés</span>
            </div>
            {[
              { term:"L'erreur", def:"Fausse représentation déterminante de la réalité" },
              { term:"Le dol", def:"Manœuvres frauduleuses d'une partie" },
              { term:"La violence", def:"Contrainte physique ou morale" },
            ].map((c, i) => (
              <div key={i} style={{ background:'#F5F5FF', borderRadius:8, padding:'5px 8px', marginBottom: i < 2 ? 4 : 0 }}>
                <div style={{ fontFamily:'system-ui,sans-serif', fontWeight:700, fontSize:9, color:'#1C1C2E' }}>{c.term}</div>
                <div style={{ fontFamily:'system-ui,sans-serif', fontSize:8, color:'#8E8EA0', marginTop:1 }}>{c.def}</div>
              </div>
            ))}
          </div>

          {/* Points essentiels */}
          <div style={{ background:'#fff', borderRadius:12, padding:'8px 10px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
              <div style={{ width:16, height:16, borderRadius:5, background:'rgba(200,255,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:7 }}>⚡</div>
              <span style={{ fontFamily:'system-ui,sans-serif', fontWeight:700, fontSize:8, color:'#1C1C2E', textTransform:'uppercase', letterSpacing:'0.5px' }}>Points essentiels</span>
            </div>
            {['Entraînent la nullité relative', 'Prescription : 5 ans', 'Seule la victime peut agir'].map((pt, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:5, marginBottom: i < 2 ? 3 : 0 }}>
                <div style={{ width:4, height:4, borderRadius:'50%', background:'#C8FF00', flexShrink:0, marginTop:3 }} />
                <span style={{ fontFamily:'system-ui,sans-serif', fontSize:8.5, color:'#3A3A4C', lineHeight:1.3 }}>{pt}</span>
              </div>
            ))}
          </div>

          {/* Astuce mémo */}
          <div style={{ background:'linear-gradient(135deg,#FFF9EC,#FFF3E0)', borderRadius:12, padding:'7px 10px', border:'1px solid rgba(255,185,0,0.15)' }}>
            <div style={{ fontFamily:'system-ui,sans-serif', fontWeight:700, fontSize:7.5, color:'#D48A00', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>💡 Astuce mémo</div>
            <div style={{ fontFamily:'system-ui,sans-serif', fontSize:8.5, color:'#78350F', lineHeight:1.4, fontStyle:'italic' }}>
              &quot;EDV = Erreur, Dol, Violence — ton consentement n&apos;était pas libre&quot;
            </div>
          </div>

          {/* Boutons action */}
          <div style={{ display:'flex', gap:5 }}>
            <button style={{ flex:1, background:'#1C1C2E', color:'#C8FF00', border:'none', borderRadius:10, padding:'7px 4px', fontFamily:'system-ui,sans-serif', fontWeight:700, fontSize:9, cursor:'pointer' }}>
              ✓ Mémorisée
            </button>
            <button style={{ flex:1, background:'#F2F2F7', color:'#3A3A4C', border:'none', borderRadius:10, padding:'7px 4px', fontFamily:'system-ui,sans-serif', fontWeight:600, fontSize:9, cursor:'pointer' }}>
              Quiz
            </button>
            <button style={{ flex:1, background:'rgba(200,255,0,0.1)', color:'#3A6B00', border:'none', borderRadius:10, padding:'7px 4px', fontFamily:'system-ui,sans-serif', fontWeight:600, fontSize:9, cursor:'pointer' }}>
              ↗ Partager
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:46,
          background:'#fff', borderTop:'1px solid rgba(0,0,0,0.07)',
          display:'flex', alignItems:'center', justifyContent:'space-around', zIndex:10,
        }}>
          {[
            { label:'Fiches', active:true, emoji:'📚' },
            { label:'QCM', active:false, emoji:'🎯' },
            { label:'Coach', active:false, emoji:'🤖' },
            { label:'Profil', active:false, emoji:'👤' },
          ].map(t => (
            <div key={t.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
              <span style={{ fontSize:14 }}>{t.emoji}</span>
              <span style={{ fontFamily:'system-ui,sans-serif', fontSize:7, fontWeight: t.active ? 700 : 400, color: t.active ? '#1C1C2E' : '#bbb' }}>{t.label}</span>
              {t.active && <div style={{ width:14, height:2, background:'#C8FF00', borderRadius:1 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
