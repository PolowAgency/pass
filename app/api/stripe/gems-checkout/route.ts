import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const PACKS: Record<string, { priceId: string; gems: number; label: string }> = {
  starter: { priceId: process.env.STRIPE_GEMS_100_PRICE_ID!, gems: 100,  label: '100 gems' },
  grinder: { priceId: process.env.STRIPE_GEMS_350_PRICE_ID!, gems: 350,  label: '350 gems' },
  legend:  { priceId: process.env.STRIPE_GEMS_1000_PRICE_ID!, gems: 1000, label: '1000 gems' },
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { pack } = await request.json()
    const packData = PACKS[pack]
    if (!packData?.priceId) return NextResponse.json({ error: 'Pack invalide' }, { status: 400 })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pass-app-xi.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: packData.priceId, quantity: 1 }],
      success_url: `${appUrl}/shop?gems_success=1`,
      cancel_url: `${appUrl}/shop`,
      metadata: { user_id: user.id, pack, gems: String(packData.gems) },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Gems checkout error:', err)
    return NextResponse.json({ error: 'Erreur Stripe' }, { status: 500 })
  }
}
