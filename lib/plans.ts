export type Plan = 'free' | 'premium' | 'exam'

export const PLANS: Record<Plan, {
  max_uploads_total: number
  max_generations_per_hour: number
  coach_messages_per_day: number
  tutor_questions_per_day: number
  label: string
  price_monthly: number | null
}> = {
  free: {
    max_uploads_total:        3,
    max_generations_per_hour: 2,
    coach_messages_per_day:   5,
    tutor_questions_per_day:  10,
    label: 'Gratuit',
    price_monthly: null,
  },
  premium: {
    max_uploads_total:        Infinity,
    max_generations_per_hour: 20,
    coach_messages_per_day:   Infinity,
    tutor_questions_per_day:  Infinity,
    label: 'Premium',
    price_monthly: 9.99,
  },
  exam: {
    max_uploads_total:        Infinity,
    max_generations_per_hour: 30,
    coach_messages_per_day:   Infinity,
    tutor_questions_per_day:  Infinity,
    label: 'Exam Boost',
    price_monthly: 19.99,
  },
}

export function getPlan(plan: string | null | undefined): Plan {
  if (plan === 'premium' || plan === 'exam') return plan
  return 'free'
}
