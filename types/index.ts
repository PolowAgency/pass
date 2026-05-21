export interface Profile {
  id: string
  email: string
  full_name: string | null
  plan: 'free' | 'premium' | 'exam'
  stripe_customer_id: string | null
  uploads_count: number
  streak_days: number
  last_active: string | null
  xp: number
  level: number
  daily_goal: number
  daily_reviewed: number
  daily_reset_at: string | null
  onboarding_completed: boolean | null
  coach_messages_today: number | null
  coach_messages_reset_at: string | null
  email_notifications: boolean | null
  daily_reminder_time: string | null
  notification_streak_alert: boolean | null
  created_at: string
}

export interface Cours {
  id: string
  user_id: string
  title: string
  subject: string | null
  exam_date: string | null
  file_url: string | null
  file_type: string | null
  raw_content: string | null
  status: 'processing' | 'ready' | 'error'
  prep_score: number
  created_at: string
}

export interface KeyConcept {
  term: string
  definition: string
  example: string
}

export interface FicheContent {
  summary: string
  key_concepts: KeyConcept[]
  important_points: string[]
  memory_trick: string
  schema_text?: string        // diagramme texte, tableau ou séquence ASCII
  exam_traps?: string[]       // erreurs fréquentes en examen
  key_numbers?: string[]      // chiffres, doses, dates, seuils à retenir
}

export interface Fiche {
  id: string
  cours_id: string
  user_id: string
  title: string
  content: FicheContent
  key_concepts: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  memorized: boolean
  review_count: number
  last_reviewed: string | null
  next_review: string | null
  ease_factor: number | null
  created_at: string
  image_url?: string | null
}

export interface Question {
  id: string
  cours_id: string
  fiche_id: string | null
  question: string
  options: string[]
  correct_answer: number
  explanation: string | null
  created_at: string
}

export interface QcmSession {
  id: string
  user_id: string
  cours_id: string
  score: number | null
  total_questions: number | null
  answers: Record<string, number> | null
  completed_at: string
}

export interface CoachMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface GenerateResponse {
  fiches: {
    title: string
    content: FicheContent
    difficulty: 'easy' | 'medium' | 'hard'
  }[]
  questions: {
    fiche_title: string
    question: string
    options: string[]
    correct_answer: number
    explanation: string
  }[]
  prep_score_initial: number
}
