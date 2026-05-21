import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Sécurité : clé secrète pour le cron Vercel
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const supabase = getSupabaseAdmin()
  const resend = new Resend(process.env.RESEND_API_KEY)
  const todayUTC = new Date().toISOString().split('T')[0]

  // Trouver les users avec streak > 0 et pas d'activité aujourd'hui
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, streak_days, notification_streak_alert')
    .gt('streak_days', 0)
    .neq('last_active', todayUTC)
    .eq('email_notifications', true)
    .eq('notification_streak_alert', true)
    .not('email', 'is', null)

  if (error) {
    console.error('streak-reminder query error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No users to notify' })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pass-saas.vercel.app'
  let sent = 0
  const errors: string[] = []

  for (const user of users) {
    try {
      const firstName = user.full_name?.split(' ')[0] ?? 'toi'
      await resend.emails.send({
        from: 'PASS <noreply@pass-app.fr>',
        to: user.email,
        subject: `🔥 ${user.streak_days} jours de streak — il reste 6h`,
        html: streakEmailHtml({ firstName, streak: user.streak_days, appUrl }),
      })
      sent++
    } catch (e) {
      errors.push(`${user.email}: ${(e as Error).message}`)
    }
  }

  return NextResponse.json({ sent, total: users.length, errors: errors.length > 0 ? errors : undefined })
}

function streakEmailHtml({ firstName, streak, appUrl }: { firstName: string; streak: number; appUrl: string }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0C0C10;font-family:'DM Sans',Arial,sans-serif;color:#F0F0F8;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;">

    <p style="font-family:Outfit,Arial,sans-serif;font-weight:800;font-size:24px;color:#F0F0F8;letter-spacing:-0.5px;margin:0 0 32px">
      PA<span style="color:#C8FF00">SS</span>
    </p>

    <div style="background:#14141A;border:2px solid #2A2A38;border-radius:20px;padding:32px 28px;margin-bottom:24px;">
      <p style="font-size:48px;margin:0 0 16px;line-height:1">🔥</p>
      <h1 style="font-family:Outfit,Arial,sans-serif;font-weight:800;font-size:22px;color:#F0F0F8;margin:0 0 12px;line-height:1.3">
        ${firstName}, ton streak de ${streak} jours est en danger
      </h1>
      <p style="font-size:14px;color:#6B6B88;line-height:1.6;margin:0 0 24px">
        Tu n'as pas encore révisé aujourd'hui. Il reste 6 heures avant minuit — ${streak} jours d'effort ne méritent pas d'être perdus pour une nuit.
      </p>
      <a href="${appUrl}/review"
        style="display:inline-block;background:#C8FF00;color:#0C0C10;text-decoration:none;font-family:Outfit,Arial,sans-serif;font-weight:800;font-size:15px;padding:14px 28px;border-radius:12px;box-shadow:0 4px 0 #8AAB00">
        Réviser maintenant →
      </a>
    </div>

    <p style="font-size:11px;color:#3A3A50;text-align:center;margin:0">
      Tu reçois cet email car tu as activé les alertes streak dans PASS.<br>
      <a href="${appUrl}/settings" style="color:#6B6B88;text-decoration:underline">Désactiver les notifications</a>
    </p>
  </div>
</body>
</html>`
}
