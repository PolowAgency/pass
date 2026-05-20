# PASS — Révise 10x plus vite avec l'IA

> Le Duolingo de la révision. Fiches IA + QCM + Coach + Streak quotidien.

**Live** → [pass-saas.vercel.app](https://pass-saas.vercel.app)

---

## Stack

| Couche | Tech |
|--------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Base de données | Supabase (PostgreSQL + RLS + Auth) |
| IA | Groq — llama-3.3-70b-versatile (gratuit) |
| Paiement | Stripe (optionnel) |
| Animations | Framer Motion v12 |
| Déploiement | Vercel (région cdg1 — Paris) |

---

## Setup local

```bash
git clone https://github.com/PolowAgency/pass.git
cd pass-app
npm install
cp .env.example .env.local
# Remplis les variables dans .env.local
npm run dev
```

L'app tourne sur `http://localhost:3002`

---

## Variables d'environnement

Voir `.env.example` pour la liste complète.

**Minimum requis :**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROQ_API_KEY` (gratuit sur [console.groq.com](https://console.groq.com))

---

## Supabase — Migrations

Exécuter dans l'ordre dans **Supabase > SQL Editor** :

```
001_initial_schema.sql
002_gamification.sql
003_badges.sql
004_notifications.sql
005_gamification_v2.sql   ← nouveau
```

---

## Architecture

```
pass-app/
├── app/
│   ├── (app)/          # Pages protégées
│   │   ├── dashboard/  # Dashboard + Mission du jour
│   │   ├── upload/     # Upload cours + génération IA
│   │   ├── review/     # Révision fiches (spaced repetition)
│   │   ├── qcm/[id]/   # QCM interactif
│   │   ├── coach/      # Coach IA
│   │   ├── stats/      # Statistiques
│   │   └── settings/   # Paramètres + plans
│   ├── api/
│   │   ├── generate/   # PDF → fiches IA (Groq)
│   │   ├── coach/      # Coach IA (Groq)
│   │   ├── xp/         # XP sécurisé (whitelist + source_id)
│   │   ├── badges/     # Badges automatiques
│   │   └── stripe/     # Paiement
│   └── page.tsx        # Landing
├── components/         # UI partagée
├── lib/
│   ├── xp.ts           # XP + niveaux + titres
│   ├── badges.ts       # 22 badges définis
│   └── theme.ts        # Dark / Light theme
├── supabase/migrations/
└── proxy.ts            # Auth middleware Next.js 16
```

---

## Gamification

### Titres par niveau

| Nv | XP | Titre |
|----|-----|-------|
| 1 | 0 | Rookie |
| 2 | 100 | Débutant |
| 3 | 250 | Studieux |
| 4 | 500 | Grinder |
| 5 | 1 000 | Brain |
| 6 | 2 000 | Monster |
| 7 | 4 000 | Exam Killer |
| 8 | 7 000 | Genius |
| 9 | 12 000 | Legend |
| 10 | 20 000 | Memory God |

### Sécurité XP
- `source_id` unique en base — impossible de farmer le même XP
- Whitelist server-side des actions et montants
- Streak uniquement sur **activité réelle** (pas à l'ouverture de l'app)
- **Streak Freeze** : 1 gratuit, achetable 50 XP

### Coffre quotidien
- Récompense aléatoire : 25 / 50 / 75 / 100 XP
- Rarités : Common (60%) · Rare (28%) · Epic (10%) · Legendary (2%)
- 1 par jour, localStorage pour éviter le spam
