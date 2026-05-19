'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import PhoneMockup from '@/components/PhoneMockup'

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const twRef = useRef<HTMLSpanElement>(null)

  /* ── Particles ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = 0, H = 0
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    function rnd(min: number, max: number) { return min + Math.random() * (max - min) }
    const COLORS = ['#C8FF00', '#FF3CAC', '#3CEFFF']
    const pts = Array.from({ length: 70 }, () => ({
      x: rnd(0, window.innerWidth), y: rnd(0, window.innerHeight),
      vx: rnd(-0.25, 0.25), vy: rnd(-0.25, 0.25),
      size: rnd(0.4, 1.9),
      color: COLORS[Math.floor(Math.random() * 3)],
      alpha: rnd(0.1, 0.5),
    }))

    let raf: number
    const anim = () => {
      ctx.clearRect(0, 0, W, H)
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore()
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 110) {
          ctx.save(); ctx.globalAlpha = 0.05 * (1 - d / 110)
          ctx.strokeStyle = '#C8FF00'; ctx.lineWidth = 0.5
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); ctx.restore()
        }
      }
      raf = requestAnimationFrame(anim)
    }
    anim()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  /* ── Typewriter ── */
  useEffect(() => {
    const words = ['fiches.', 'révisions.', 'examens.', 'notes.']
    let wi = 0, ci = 0, del = false
    let timer: ReturnType<typeof setTimeout>
    const type = () => {
      const el = twRef.current; if (!el) return
      const w = words[wi]
      if (!del) { el.textContent = w.slice(0, ci + 1); ci++; if (ci === w.length) { del = true; timer = setTimeout(type, 1800); return } }
      else { el.textContent = w.slice(0, ci - 1); ci--; if (ci === 0) { del = false; wi = (wi + 1) % words.length } }
      timer = setTimeout(type, del ? 60 : 110)
    }
    timer = setTimeout(type, 1200)
    return () => clearTimeout(timer)
  }, [])

  /* ── Scroll reveal ── */
  useEffect(() => {
    const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('sr-visible') }), { threshold: 0.1 })
    document.querySelectorAll('.sr').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  /* ── Counters ── */
  useEffect(() => {
    const animate = (el: Element) => {
      const target = parseInt(el.getAttribute('data-target') || '0')
      const suffix = el.getAttribute('data-suffix') || ''
      let v = 0
      const t = setInterval(() => { v += Math.ceil(target / 40); if (v >= target) { v = target; clearInterval(t) }; el.textContent = v + suffix }, 30)
    }
    const sobs = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { document.querySelectorAll('.counter').forEach(animate); sobs.disconnect() } }) }, { threshold: 0.5 })
    const hs = document.querySelector('.hero-stats')
    if (hs) sobs.observe(hs)
    return () => sobs.disconnect()
  }, [])

  function handleWaitlist() {
    const input = document.getElementById('emailInput') as HTMLInputElement
    const msg = document.getElementById('wm')
    if (input?.value?.includes('@') && msg) { msg.style.display = 'block'; input.value = '' }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        :root{
          --bg:#0C0C10;--surface:#14141A;--surface2:#1E1E28;--border:#2A2A38;
          --lime:#C8FF00;--pink:#FF3CAC;--blue:#3CEFFF;--text:#F0F0F8;--muted:#6B6B88;
        }
        body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;overflow-x:hidden;line-height:1.6}
        h1,h2,h3,.logo{font-family:'Outfit',sans-serif;font-weight:700}
        #particles{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.5}
        .blob-container{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden}
        .blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:.1;animation:blobMove 12s ease-in-out infinite alternate}
        .blob1{width:500px;height:500px;background:var(--lime);top:-100px;left:-100px;animation-duration:14s}
        .blob2{width:400px;height:400px;background:var(--pink);top:30%;right:-80px;animation-duration:10s;animation-delay:-3s}
        .blob3{width:350px;height:350px;background:var(--blue);bottom:10%;left:20%;animation-duration:16s;animation-delay:-6s}
        @keyframes blobMove{0%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,-30px) scale(1.05)}66%{transform:translate(-20px,50px) scale(.95)}100%{transform:translate(30px,20px) scale(1.08)}}
        nav{display:flex;align-items:center;justify-content:space-between;padding:20px 48px;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;background:rgba(12,12,16,.88);backdrop-filter:blur(12px)}
        .logo{font-size:22px;font-weight:700;letter-spacing:0;color:var(--text)}.logo span{color:var(--lime)}
        .nav-links{display:flex;gap:32px;font-size:14px;list-style:none}
        .nav-links a{color:var(--muted);text-decoration:none;transition:color .2s}.nav-links a:hover{color:var(--text)}
        .nav-cta{background:var(--lime);color:#0C0C10;border:none;padding:10px 22px;border-radius:100px;font-family:'Outfit',sans-serif;font-weight:700;font-size:14px;cursor:pointer;transition:all .2s}
        .nav-cta:hover{transform:translateY(-1px);box-shadow:0 0 20px rgba(200,255,0,.3)}
        .hero{padding:90px 48px 70px;max-width:1100px;margin:0 auto;position:relative;z-index:1;text-align:center}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--surface2);border:1px solid var(--border);border-radius:100px;padding:6px 16px;font-size:13px;color:var(--muted);margin-bottom:32px;opacity:0;transform:translateY(20px);animation:fadeUp .6s .1s forwards}
        .badge-dot{width:8px;height:8px;border-radius:50%;background:var(--lime);animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(200,255,0,.4)}50%{opacity:.7;box-shadow:0 0 0 8px rgba(200,255,0,0)}}
        h1{font-size:clamp(38px,5.5vw,74px);font-weight:700;line-height:1.05;letter-spacing:-0.5px;margin-bottom:24px;opacity:0;animation:fadeUp .7s .2s forwards}
        .accent-pink{color:var(--pink)}.accent-lime{color:var(--lime)}
        .cursor{display:inline-block;width:3px;height:.85em;background:var(--lime);margin-left:2px;vertical-align:middle;animation:blink .7s infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .hero-sub{font-size:18px;color:var(--muted);max-width:540px;line-height:1.6;margin:0 auto 40px;opacity:0;animation:fadeUp .7s .4s forwards}
        .hero-sub strong{color:var(--text)}
        .hero-actions{display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap;opacity:0;animation:fadeUp .7s .5s forwards}
        .btn-main{background:var(--lime);color:#0C0C10;border:none;padding:16px 32px;border-radius:100px;font-family:'Outfit',sans-serif;font-weight:700;font-size:16px;cursor:pointer;transition:all .2s}
        .btn-main:hover{transform:translateY(-2px);box-shadow:0 0 32px rgba(200,255,0,.35)}
        .btn-ghost{background:transparent;color:var(--text);border:1px solid var(--border);padding:16px 28px;border-radius:100px;font-family:'Outfit',sans-serif;font-weight:700;font-size:15px;cursor:pointer;transition:all .2s}
        .btn-ghost:hover{border-color:var(--muted);background:var(--surface)}
        .hero-stats{display:flex;gap:40px;margin-top:56px;padding-top:40px;border-top:1px solid var(--border);opacity:0;animation:fadeUp .7s .7s forwards;justify-content:center}
        .stat-num{font-family:'Outfit',sans-serif;font-size:30px;font-weight:700;display:block}
        .stat-label{font-size:13px;color:var(--muted)}
        @keyframes fadeUp{to{opacity:1;transform:translateY(0)}}
        .iphone-section{padding:60px 48px 80px;max-width:1100px;margin:0 auto;position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:48px}
        .iphone-texts{text-align:center;max-width:560px}
        .section-label{font-size:12px;text-transform:uppercase;letter-spacing:2px;color:var(--lime);font-weight:700;margin-bottom:12px}
        .section-title{font-family:'Outfit',sans-serif;font-size:clamp(26px,3.5vw,42px);font-weight:700;letter-spacing:0;line-height:1.15}
        .section-sub{font-size:15px;color:var(--muted);margin-top:14px;line-height:1.6}
        .iphone-feats{display:flex;gap:20px;justify-content:center;margin-top:20px;flex-wrap:wrap}
        .ifeat{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--muted)}
        .ifeat-dot{width:6px;height:6px;border-radius:50%;background:var(--lime);flex-shrink:0}
        .iphone-scene{position:relative;display:flex;justify-content:center;align-items:center}
        .iphone-glow{position:absolute;width:300px;height:300px;background:radial-gradient(circle,rgba(200,255,0,.08) 0%,transparent 70%);border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
        .iphone{position:relative;width:280px;background:#1C1C1E;border-radius:52px;padding:11px;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.15),inset 0 0 0 2.5px rgba(0,0,0,.9),0 0 0 1px rgba(0,0,0,.6),0 60px 120px rgba(0,0,0,.9),0 20px 40px rgba(0,0,0,.5)}
        .btn-l{position:absolute;left:-3px;top:92px;width:3px;height:30px;background:#2A2A2C;border-radius:2px 0 0 2px}
        .btn-l2{position:absolute;left:-3px;top:134px;width:3px;height:58px;background:#2A2A2C;border-radius:2px 0 0 2px}
        .btn-l3{position:absolute;left:-3px;top:204px;width:3px;height:58px;background:#2A2A2C;border-radius:2px 0 0 2px}
        .btn-r{position:absolute;right:-3px;top:148px;width:3px;height:84px;background:#2A2A2C;border-radius:0 2px 2px 0}
        .screen{background:#000;border-radius:42px;overflow:hidden;position:relative}
        .screen-inner{border-radius:42px;overflow:hidden;background:#F2F2F7;position:relative}
        .glare{position:absolute;top:0;left:0;right:0;height:45%;background:linear-gradient(160deg,rgba(255,255,255,.07) 0%,transparent 100%);border-radius:42px 42px 0 0;pointer-events:none;z-index:20}
        .di{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:100px;height:29px;background:#000;border-radius:20px;z-index:25;display:flex;align-items:center;justify-content:space-between;padding:0 16px}
        .di-cam{width:11px;height:11px;border-radius:50%;background:#111;border:2.5px solid #0a0a0a}
        .di-bar{width:36px;height:5px;background:#0d0d0d;border-radius:3px}
        .statusbar{background:linear-gradient(135deg,#1C1C2E,#2D1B69);padding:13px 20px 9px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:5}
        .s-time{font-size:14px;font-weight:600;color:#fff;letter-spacing:-.3px}
        .s-right{display:flex;align-items:center;gap:5px}
        .s-signal{display:flex;gap:1.5px;align-items:flex-end}
        .s-bar{width:3px;background:rgba(255,255,255,.9);border-radius:1px}
        .s-battery{width:20px;height:10px;border:1.5px solid rgba(255,255,255,.55);border-radius:3px;position:relative;margin-left:2px}
        .s-battery::after{content:'';position:absolute;right:-3.5px;top:50%;transform:translateY(-50%);width:2px;height:5px;background:rgba(255,255,255,.4);border-radius:0 1px 1px 0}
        .s-bfill{position:absolute;left:1px;top:1px;bottom:1px;width:72%;background:#fff;border-radius:1.5px}
        .app-header{background:linear-gradient(135deg,#1C1C2E,#2D1B69);padding:4px 16px 16px;position:relative;overflow:hidden}
        .app-header::before{content:'';position:absolute;top:-40px;right:-20px;width:100px;height:100px;background:rgba(200,255,0,.07);border-radius:50%}
        .ah-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;position:relative;z-index:1}
        .ah-name{font-family:'Outfit',sans-serif;font-size:13px;font-weight:800;color:#fff}
        .ah-sub{font-size:9px;color:rgba(255,255,255,.4);margin-top:1px;display:flex;align-items:center;gap:4px}
        .ah-online{width:5px;height:5px;border-radius:50%;background:#C8FF00;animation:pulse 2s infinite}
        .subj-pill{background:rgba(200,255,0,.12);border-radius:100px;padding:3px 9px;font-size:9px;color:rgba(200,255,0,.8);font-weight:600;text-transform:uppercase;letter-spacing:.8px}
        .prog-row{display:flex;align-items:center;gap:5px;margin-bottom:8px;position:relative;z-index:1}
        .pdot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.18)}
        .pdot.on{background:#C8FF00}
        .prog-txt{font-size:9px;color:rgba(255,255,255,.35)}
        .fiche-nm{font-family:'Outfit',sans-serif;font-size:15px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:3px;position:relative;z-index:1}
        .fiche-mt{font-size:9px;color:rgba(255,255,255,.35);position:relative;z-index:1}
        .fbody{padding:11px;display:flex;flex-direction:column;gap:7px;background:#F2F2F7}
        .card{background:#fff;border-radius:15px;padding:10px 12px;box-shadow:0 1px 6px rgba(0,0,0,.07);display:flex;gap:8px;align-items:flex-start}
        .ic{width:27px;height:27px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;margin-top:1px}
        .ic-p{background:#F0EEFF}.ic-pk{background:#FFF0F6}.ic-b{background:#EFF8FF}
        .c-term{font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;color:#1C1C2E;margin-bottom:2px}
        .c-def{font-size:9.5px;color:#8E8EA0;line-height:1.4}
        .kpc{background:#fff;border-radius:15px;padding:10px 12px;box-shadow:0 1px 6px rgba(0,0,0,.07)}
        .kph{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.9px;color:#5CB800;margin-bottom:7px;display:flex;align-items:center;gap:4px}
        .kph::before{content:'';width:10px;height:2px;background:#C8FF00;border-radius:1px}
        .kpi{display:flex;align-items:flex-start;gap:6px;padding:3px 0;border-bottom:1px solid #F2F2F7;font-size:9.5px;color:#3A3A4C;line-height:1.35}
        .kpi:last-child{border-bottom:none;padding-bottom:0}
        .kpb{width:4px;height:4px;border-radius:50%;background:#C8FF00;flex-shrink:0;margin-top:4px}
        .memo{background:linear-gradient(135deg,#FFF9EC,#FFF3E0);border-radius:15px;padding:10px 12px;border:1px solid rgba(255,185,0,.14)}
        .memo-h{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.9px;color:#D48A00;margin-bottom:4px}
        .memo-t{font-size:9.5px;color:#5A4520;line-height:1.4;font-style:italic}
        .sr-row{display:flex;gap:6px;padding:2px 0}
        .sm{flex:1;background:#fff;border-radius:11px;padding:8px 6px;box-shadow:0 1px 6px rgba(0,0,0,.07);text-align:center}
        .sn{font-family:'Outfit',sans-serif;font-size:16px;font-weight:800;color:#1C1C2E;display:block}
        .sl{font-size:8.5px;color:#8E8EA0;margin-top:1px}
        .nl{color:#5CB800}.np{color:#D0005A}
        .acts{display:flex;gap:6px}
        .ab{flex:1;padding:9px 4px;border-radius:11px;border:none;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:3px}
        .ab-p{background:#1C1C2E;color:#C8FF00}.ab-s{background:#F2F2F7;color:#3A3A4C}.ab-sh{background:rgba(200,255,0,.1);color:#3A6B00}
        .tabbar{background:#fff;padding:7px 6px 12px;display:flex;justify-content:space-around;border-top:.5px solid rgba(0,0,0,.07)}
        .tab{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:8.5px;color:#8E8EA0;cursor:pointer;padding:1px 8px}
        .tab.on{color:#1C1C2E}
        .tab-ic{font-size:17px}
        .tab-b{width:14px;height:2px;background:transparent;border-radius:1px;margin-top:1px}
        .tab.on .tab-b{background:#1C1C2E}
        .home-ind{height:16px;display:flex;align-items:center;justify-content:center;background:#fff}
        .home-pill{width:80px;height:4px;background:#1C1C2E;border-radius:2px;opacity:.15}
        .sr{opacity:0;transform:translateY(40px);transition:opacity .7s ease,transform .7s ease}
        .sr.sr-visible{opacity:1;transform:translateY(0)}
        .sr-d1{transition-delay:.1s}.sr-d2{transition-delay:.2s}.sr-d3{transition-delay:.3s}.sr-d4{transition-delay:.4s}
        .divider{height:1px;background:var(--border);max-width:1100px;margin:0 auto;position:relative;z-index:1}
        .features-section{padding:80px 48px;max-width:1100px;margin:0 auto;position:relative;z-index:1}
        .features-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
        @media(max-width:640px){.features-grid{grid-template-columns:1fr}}
        .feature-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px;transition:all .3s;position:relative;overflow:hidden}
        .feature-card::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(200,255,0,.04),transparent 70%);opacity:0;transition:opacity .3s}
        .feature-card:hover{border-color:rgba(200,255,0,.3);transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.3)}
        .feature-card:hover::after{opacity:1}
        .feature-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:20px}
        .fi-lime{background:rgba(200,255,0,.12)}.fi-pink{background:rgba(255,60,172,.12)}.fi-blue{background:rgba(60,239,255,.12)}.fi-orange{background:rgba(255,107,0,.12)}
        .feature-title{font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;margin-bottom:10px}
        .feature-desc{font-size:14px;color:var(--muted);line-height:1.6}
        .pricing-section{padding:80px 48px;max-width:1100px;margin:0 auto;position:relative;z-index:1}
        .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        @media(max-width:768px){.pricing-grid{grid-template-columns:1fr}}
        .price-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px;position:relative;transition:transform .3s,box-shadow .3s}
        .price-card:hover{transform:translateY(-4px);box-shadow:0 20px 48px rgba(0,0,0,.3)}
        .price-card.featured{border-color:var(--lime);background:var(--surface2)}
        .price-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--lime);color:#0C0C10;border-radius:100px;padding:4px 16px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;white-space:nowrap}
        .price-plan{font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
        .price-amount{font-family:'Outfit',sans-serif;font-size:46px;font-weight:700;letter-spacing:-0.5px;line-height:1;margin-bottom:4px}
        .price-period{font-size:14px;color:var(--muted);margin-bottom:24px}
        .price-divider{height:1px;background:var(--border);margin-bottom:20px}
        .price-feature{font-size:14px;color:var(--muted);padding:6px 0;display:flex;align-items:center;gap:10px}
        .price-feature .check{color:var(--lime);font-weight:700}
        .price-cta{width:100%;padding:14px;border-radius:100px;font-family:'Outfit',sans-serif;font-weight:700;font-size:15px;cursor:pointer;margin-top:24px;transition:all .2s}
        .cta-main{background:var(--lime);color:#0C0C10;border:none}
        .cta-main:hover{box-shadow:0 0 24px rgba(200,255,0,.3);transform:translateY(-1px)}
        .cta-ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
        .cta-ghost:hover{border-color:var(--muted);background:var(--surface2)}
        .waitlist-section{padding:80px 48px;max-width:680px;margin:0 auto;text-align:center;position:relative;z-index:1}
        .waitlist-card{background:var(--surface);border:1px solid var(--border);border-radius:28px;padding:52px 44px;position:relative;overflow:hidden}
        .waitlist-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(200,255,0,.06),transparent 60%)}
        .waitlist-card h2{font-family:'Outfit',sans-serif;font-size:38px;font-weight:800;letter-spacing:-1px;margin-bottom:12px;position:relative}
        .waitlist-card p{color:var(--muted);margin-bottom:32px;font-size:16px;position:relative}
        .email-form{display:flex;gap:12px;max-width:460px;margin:0 auto;position:relative}
        .email-input{flex:1;background:var(--bg);border:1px solid var(--border);border-radius:100px;padding:14px 22px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s}
        .email-input:focus{border-color:var(--lime)}
        .email-input::placeholder{color:var(--muted)}
        .email-btn{background:var(--lime);color:#0C0C10;border:none;padding:14px 24px;border-radius:100px;font-family:'Outfit',sans-serif;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;transition:all .2s}
        .email-btn:hover{transform:translateY(-1px);box-shadow:0 0 20px rgba(200,255,0,.3)}
        footer{padding:36px 48px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;color:var(--muted);font-size:13px;position:relative;z-index:1}
        .footer-logo{font-family:'Outfit',sans-serif;font-weight:800;font-size:16px;color:var(--text)}
        .footer-logo span{color:var(--lime)}
        @media(max-width:768px){
          nav{padding:16px 20px}
          .nav-links{display:none}
          .hero{padding:60px 20px 50px}
          .hero-stats{gap:24px}
          .iphone-section,.features-section,.pricing-section{padding:60px 20px}
          .waitlist-section{padding:60px 20px}
          .waitlist-card{padding:36px 24px}
          .email-form{flex-direction:column}
          footer{padding:24px 20px;flex-direction:column;gap:16px;text-align:center}
        }
      `}</style>

      <canvas id="particles" ref={canvasRef} />
      <div className="blob-container">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
      </div>

      {/* NAV */}
      <nav>
        <div className="logo">PA<span>SS</span></div>
        <ul className="nav-links">
          <li><a href="#fonctionnalites">Fonctionnalités</a></li>
          <li><a href="#tarifs">Tarifs</a></li>
        </ul>
        <Link href="/signup"><button className="nav-cta">Essayer gratuitement</button></Link>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge"><span className="badge-dot" />1 200+ étudiants en liste d&apos;attente</div>
        <h1>
          Finis de perdre<br />
          <span className="accent-pink">2h</span> à faire<br />
          tes <span className="accent-lime"><span ref={twRef} /><span className="cursor" /></span>
        </h1>
        <p className="hero-sub">
          Upload ton cours. <strong>PASS génère tout en 30 secondes</strong> — fiches, QCM, planning.
          Avec un design tellement beau que t&apos;as envie de les partager.
        </p>
        <div className="hero-actions">
          <Link href="/signup"><button className="btn-main">Commencer gratuitement →</button></Link>
          <button className="btn-ghost">Voir la démo</button>
        </div>
        <div className="hero-stats">
          <div>
            <span className="stat-num" style={{ color: 'var(--lime)' }}><span className="counter" data-target="30" data-suffix="s">0s</span></span>
            <span className="stat-label">Pour générer un cours</span>
          </div>
          <div>
            <span className="stat-num" style={{ color: 'var(--pink)' }}><span className="counter" data-target="4">0</span></span>
            <span className="stat-label">Thèmes visuels</span>
          </div>
          <div>
            <span className="stat-num" style={{ color: 'var(--blue)' }}>0€</span>
            <span className="stat-label">Pour commencer</span>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* IPHONE SECTION */}
      <section className="iphone-section sr">
        <div className="iphone-texts">
          <div className="section-label">Application mobile</div>
          <div className="section-title">Tout dans<br /><span style={{ color: 'var(--pink)' }}>ta poche.</span></div>
          <div className="section-sub">Tes fiches, ton coach, ton planning. Disponibles partout, en 30 secondes chrono.</div>
          <div className="iphone-feats">
            <div className="ifeat"><div className="ifeat-dot" />Fiches générées en 30s</div>
            <div className="ifeat"><div className="ifeat-dot" />Coach IA 24h/24</div>
            <div className="ifeat"><div className="ifeat-dot" />Export Instagram HD</div>
          </div>
        </div>

        <div className="iphone-scene">
          <div className="iphone-glow" />
          <div style={{
            transform: 'perspective(900px) rotateY(-18deg) rotateX(4deg)',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.4s ease',
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'perspective(900px) rotateY(-8deg) rotateX(2deg)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'perspective(900px) rotateY(-18deg) rotateX(4deg)')}
          >
            <PhoneMockup />
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* FEATURES */}
      <section className="features-section" id="fonctionnalites">
        <div className="section-label sr">Pourquoi PASS</div>
        <div className="section-title sr" style={{ marginBottom: 40 }}>Tout ce dont t&apos;as<br />besoin pour cartonner.</div>
        <div className="features-grid">
          {[
            { icon: '📄', cls: 'fi-lime', title: 'Upload universel', desc: 'PDF, photo de cahier, enregistrement vocal. PASS lit tout et extrait l\'essentiel automatiquement.', delay: 'sr-d1' },
            { icon: '✨', cls: 'fi-pink', title: 'Fiches esthétiques', desc: '4 thèmes visuels premium. Des fiches tellement belles que t\'as envie de les poster sur ton feed.', delay: 'sr-d2' },
            { icon: '🎯', cls: 'fi-blue', title: 'QCM adaptatif', desc: 'Des questions calibrées sur ton niveau réel. Plus tu rates, plus PASS insiste sur ce qui compte.', delay: 'sr-d3' },
            { icon: '🤖', cls: 'fi-orange', title: 'Coach IA personnel', desc: 'Direct, honnête, sans bullshit. Ton coach sait exactement où t\'en es et ce que tu dois faire.', delay: 'sr-d4' },
          ].map((f, i) => (
            <div key={i} className={`feature-card sr ${f.delay}`}>
              <div className={`feature-icon ${f.cls}`}>{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* PRICING */}
      <section className="pricing-section" id="tarifs">
        <div className="section-label sr">Tarifs</div>
        <div className="section-title sr" style={{ marginBottom: 40 }}>Simple. Honnête.</div>
        <div className="pricing-grid">
          <div className="price-card sr sr-d1">
            <div className="price-plan">Free</div>
            <div className="price-amount">0€</div>
            <div className="price-period">pour toujours</div>
            <div className="price-divider" />
            {['5 cours par mois', 'Thème Dark Premium', 'QCM inclus', 'Coach basique'].map(f => (
              <div key={f} className="price-feature"><span className="check">✓</span>{f}</div>
            ))}
            <Link href="/signup"><button className="price-cta cta-ghost">Commencer</button></Link>
          </div>
          <div className="price-card featured sr sr-d2">
            <div className="price-badge">⚡ Le plus populaire</div>
            <div className="price-plan" style={{ color: 'var(--lime)' }}>Premium</div>
            <div className="price-amount" style={{ color: 'var(--lime)' }}>9€</div>
            <div className="price-period">par mois sans engagement</div>
            <div className="price-divider" />
            {['Cours illimités', '4 thèmes visuels', 'Export HD shareable', 'Coach premium 24/7'].map(f => (
              <div key={f} className="price-feature"><span className="check">✓</span>{f}</div>
            ))}
            <Link href="/signup"><button className="price-cta cta-main">Essayer 1 mois gratuit</button></Link>
          </div>
          <div className="price-card sr sr-d3">
            <div className="price-plan">Exam</div>
            <div className="price-amount">19€</div>
            <div className="price-period">one-shot 2 semaines</div>
            <div className="price-divider" />
            {['Tout Premium inclus', 'Plan J-14 personnalisé', 'Coach intensif', 'Mode révision express'].map(f => (
              <div key={f} className="price-feature"><span className="check">✓</span>{f}</div>
            ))}
            <button className="price-cta cta-ghost">Choisir Exam</button>
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section className="waitlist-section sr">
        <div className="waitlist-card">
          <h2>T&apos;es prêt à<br /><span style={{ color: 'var(--lime)' }}>cartonner</span> ?</h2>
          <p>Rejoins la liste d&apos;attente. Accès en avant-première et 1 mois premium offert.</p>
          <div className="email-form">
            <input className="email-input" type="email" placeholder="ton@email.com" id="emailInput" />
            <button className="email-btn" onClick={handleWaitlist}>Je m&apos;inscris →</button>
          </div>
          <div id="wm" style={{ marginTop: 16, fontSize: 14, color: 'var(--lime)', display: 'none' }}>
            ✓ Tu es sur la liste ! On te prévient en premier.
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">PA<span>SS</span> <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--muted)' }}>by POLOW Agency</span></div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="#" style={{ color: 'var(--muted)', textDecoration: 'none' }}>CGU</a>
          <a href="#" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Confidentialité</a>
          <a href="#" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Contact</a>
        </div>
      </footer>
    </>
  )
}
