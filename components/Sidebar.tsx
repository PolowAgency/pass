'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { motion } from 'framer-motion'
import { LayoutDashboard, Upload, MessageCircle, Settings, LogOut, BookOpen, BarChart2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', emoji: '🏠' },
  { href: '/review',    icon: BookOpen,        label: 'Révision',  emoji: '🧠' },
  { href: '/upload',    icon: Upload,          label: 'Upload',    emoji: '📤' },
  { href: '/coach',     icon: MessageCircle,   label: 'Coach IA',  emoji: '🤖' },
  { href: '/stats',     icon: BarChart2,       label: 'Stats',     emoji: '📊' },
]

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Home',    emoji: '🏠' },
  { href: '/review',    label: 'Réviser', emoji: '🧠' },
  { href: '/upload',    label: 'Upload',  emoji: '📤' },
  { href: '/coach',     label: 'Coach',   emoji: '🤖' },
  { href: '/stats',     label: 'Stats',   emoji: '📊' },
]

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const { colors, theme } = useTheme()

  async function signOut() {
    await createClient().auth.signOut()
    toast.success('À bientôt !')
    router.push('/login')
    router.refresh()
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 z-40"
        style={{ background: colors.surface, borderRight: `2px solid ${colors.border}`, transition: 'background 0.25s' }}>

        <div style={{ padding: '24px 24px 16px' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <motion.span whileHover={{ scale: 1.04 }} style={{ display: 'inline-block', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: colors.text, letterSpacing: '-0.5px' }}>
              PA<span style={{ color: colors.lime }}>SS</span>
            </motion.span>
          </Link>
        </div>

        <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ href, label, emoji }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ x: active ? 0 : 4 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 16, cursor: 'pointer',
                    background: active ? colors.navActiveBg : 'transparent',
                    border: `2px solid ${active ? colors.navActiveBorder : 'transparent'}`,
                    boxShadow: active ? `0 3px 0 ${theme === 'dark' ? colors.limeDark + '50' : '#CCEE00'}` : 'none',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}>
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{emoji}</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: active ? 800 : 500, fontSize: 14, color: active ? colors.navActiveText : colors.muted }}>
                    {label}
                  </span>
                  {active && (
                    <motion.div layoutId="nav-dot"
                      style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: colors.lime, boxShadow: theme === 'dark' ? `0 0 10px ${colors.lime}` : 'none' }} />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '8px 12px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href="/settings" style={{ textDecoration: 'none' }}>
            <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', damping: 20, stiffness: 400 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, cursor: 'pointer', color: pathname === '/settings' ? colors.text : colors.muted }}>
              <span style={{ fontSize: 16 }}>{'⚙️'}</span>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 14 }}>Param{'è'}tres</span>
            </motion.div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 16, background: colors.surface2, border: `2px solid ${colors.border}`, marginTop: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: colors.limeBg, border: `2px solid ${colors.limeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13, color: colors.limeDark, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name?.split(' ')[0] ?? 'Étudiant'}
              </p>
              <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>
                {profile?.plan === 'free' ? 'Plan gratuit' : '⚡ Premium'}
              </p>
            </div>
            <motion.button onClick={signOut} whileTap={{ scale: 0.9 }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.muted, padding: 4, borderRadius: 8 }}>
              <LogOut size={14} />
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
        style={{ background: colors.surface, borderTop: `2px solid ${colors.border}`, paddingTop: 6, paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        {MOBILE_NAV.map(({ href, emoji, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none', flex: 1 }}>
              <motion.div whileTap={{ scale: 0.85 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 0', position: 'relative' }}>
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <span style={{ fontSize: 10, fontFamily: 'Outfit, sans-serif', fontWeight: active ? 800 : 400, color: active ? colors.navActiveText : colors.muted }}>{label}</span>
                {active && (
                  <motion.div layoutId="mobile-nav-dot"
                    style={{ position: 'absolute', bottom: -6, width: 4, height: 4, borderRadius: '50%', background: colors.lime }} />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
