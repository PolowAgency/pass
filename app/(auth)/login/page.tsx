'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) { setError('Email ou mot de passe incorrect.'); setLoading(false); return }
    toast.success('Connecté !')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box }
        body { background:#0C0C10; font-family:'DM Sans',sans-serif }
        .blob { position:fixed; border-radius:50%; filter:blur(80px); opacity:.1; pointer-events:none; z-index:0; animation:blobMove 14s ease-in-out infinite alternate }
        @keyframes blobMove { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(30px,20px) scale(1.08)} }
      `}</style>

      <div className="blob" style={{ width:500, height:500, background:'#C8FF00', top:-100, right:-100 }} />
      <div className="blob" style={{ width:350, height:350, background:'#3CEFFF', bottom:'15%', left:'-5%', animationDuration:'11s', animationDelay:'-4s' }} />

      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative', zIndex:1 }}>
        <div style={{ width:'100%', maxWidth:440 }}>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <Link href="/" style={{ display:'inline-flex', alignItems:'center', textDecoration:'none' }}>
              <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:32, color:'#F0F0F8', letterSpacing:'-0.5px' }}>
                PA<span style={{ color:'#C8FF00' }}>SS</span>
              </span>
            </Link>
            <p style={{ marginTop:10, fontSize:14, color:'#6B6B88' }}>Content de te revoir 👋</p>
          </div>

          {/* Card */}
          <div style={{ background:'#14141A', border:'1px solid #2A2A38', borderRadius:24, padding:'36px 32px' }}>
            <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:24, color:'#F0F0F8', marginBottom:24 }}>Connexion</h1>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { label:'Email', type:'email', value:email, setter:setEmail, icon:<Mail size={16} color="#6B6B88" />, placeholder:'ton@email.com' },
                { label:'Mot de passe', type:'password', value:password, setter:setPassword, icon:<Lock size={16} color="#6B6B88" />, placeholder:'••••••••' },
              ].map(f => (
                <div key={f.label} style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <label style={{ fontSize:13, fontWeight:500, color:'#F0F0F8' }}>{f.label}</label>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}>{f.icon}</div>
                    <input
                      type={f.type} value={f.value} onChange={e => f.setter(e.target.value)}
                      placeholder={f.placeholder} required
                      style={{ width:'100%', background:'#1E1E28', border:'1px solid #2A2A38', borderRadius:12, padding:'12px 14px 12px 42px', fontSize:14, color:'#F0F0F8', outline:'none', transition:'border-color .2s', fontFamily:'DM Sans,sans-serif' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(200,255,0,0.4)'}
                      onBlur={e => e.target.style.borderColor = '#2A2A38'}
                    />
                  </div>
                </div>
              ))}

              {error && (
                <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'10px 14px', fontSize:13, color:'#f87171' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ marginTop:8, background:'#C8FF00', color:'#0C0C10', border:'none', borderRadius:14, padding:'14px', fontSize:15, fontWeight:700, fontFamily:'Outfit,sans-serif', cursor:loading ? 'not-allowed' : 'pointer', opacity:loading ? 0.6 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 0 24px rgba(200,255,0,0.25)', transition:'all .2s' }}>
                {loading ? 'Connexion…' : <><Zap size={16} />Se connecter</>}
              </button>
            </form>

            <div style={{ marginTop:20, textAlign:'center', fontSize:14, color:'#6B6B88' }}>
              Pas encore de compte ?{' '}
              <Link href="/signup" style={{ color:'#C8FF00', fontWeight:600, textDecoration:'none' }}>Créer un compte</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
