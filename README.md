# ATLAS — Adaptive Forex & Binary Options Learning Platform

An adaptive, self-evolving trading academy that teaches users from absolute zero, measures their understanding, guides their practical training, and continuously introduces new educational experiences as they progress.

Built with **Next.js 16 · TypeScript · Prisma · Tailwind CSS · shadcn/ui · z-ai-web-dev-sdk**.

---

## What's inside

### Learning engine
- **Adaptive curriculum** — 5 learning paths (Forex Foundations, Technical Analysis, Risk Management, Trading Psychology, Binary Options) with prerequisite-gated unlocking
- **6-state skill mastery** — Not Started → Learning → Developing → Practising → Demonstrated → Needs Revision
- **Spaced repetition** — correct answers schedule revision cards 2 days later
- **Diagnostic assessment** — 10-question placement test that auto-unlocks foundational lessons for advanced learners

### 3D Skill Universe (`/workspace/skill-universe`)
- Real 3D rotating sphere of all skills — pure SVG + CSS transforms (no Three.js)
- Fibonacci-sphere distribution, drag-to-rotate, zoom, click any node → detail panel with mastery state, evidence score, prerequisite chain, and "unlocks" list
- Color-coded mastery states, node size scales with evidence score

### Simulations
1. **Trading Lab** — Candlestick replay with 5 instruments, drawing tools (S/R Ray, Fib), indicators (SMA, EMA, Bollinger, RSI). Plan-First Decision Journal enforces thesis + risk checkboxes before order placement.
2. **Risk Laboratory** (7 tabs) — Position Sizing, Losing Streaks, R:R Expectancy, Drawdown Curve, Leverage & Margin Call, Spread & Slippage Cost, Correlation Risk
3. **Backtest Arena** — 4 strategies (SMA Crossover, RSI Oversold, Donchian Breakout, Bollinger Reversion) × 5 instruments, with equity-curve SVG chart and trade-by-trade audit table
4. **Monte Carlo Lab** — Runs N parallel random-walk equity simulations, shows Risk of Ruin %, fan chart with color-coded paths
5. **Binary Options Lab** — Educational simulator with FCA/ESMA/ASIC ban disclaimer, Monte Carlo house-edge proof

### Learning Analytics (`/workspace/analytics`)
- 5 KPI tiles (XP, streak, study time, lessons, skills demonstrated)
- XP velocity chart (14-day bars)
- Mastery distribution donut (SVG ring chart)
- 12-week activity heatmap (GitHub-style)
- Retention decay risk profile (low/medium/high buckets)
- Recent skill state transitions timeline

### Adaptive Onboarding (`/workspace/onboarding`)
- 4-step wizard: Goal → Time budget → Learning style → Personalised path preview
- Generates a curriculum sequence based on goal (Career/Hobby/Income/Education)
- Awards +25 XP on completion, creates first LearningSession

### Smart Gamification (`/workspace/achievements`)
- **24 achievements** across 6 categories + 3 XP milestones
- 4 tiers (bronze/silver/gold/platinum) with distinct colors
- Wired into 4 flows: assessments, sim orders, binary sims, onboarding
- **Skill decay automation** — downgrades demonstrated skills to "needs_revision" after 30 days
- **Personalised lesson reordering** by learningStyle (visual/interactive/reading/mixed)

### LLM AI Coach (`/workspace/coach`)
- Powered by `z-ai-web-dev-sdk` (real LLM, not rule-based)
- **Hard guardrails** — 8 forbidden regex patterns short-circuit before LLM call (no price predictions, no trading signals, no financial advice)
- **Full user context grounding** — system prompt includes XP, streak, persona, learning style, demonstrated skills (by code), recent trades with process scores, unlocked achievements
- Graceful fallback to rule-based responses if LLM is unavailable

### Admin Knowledge Studio (`/workspace/studio`)
- Lesson authoring UI for admins/owners
- Draft → Review → Publish workflow with version history
- Audit log of all administrative actions

---

## Getting started

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL database (local, Vercel Postgres, Neon, or Supabase)

### Install & run
```bash
bun install

# Create your .env file from the example
cp .env.example .env
# Edit .env to point at your Postgres database

bun run db:push    # Create database schema
bun run db:generate # Generate Prisma client
bun run dev        # Start dev server on http://localhost:3000
```

### Environment variables
See [`.env.example`](./.env.example) for the full reference. You need:
- `DATABASE_URL` — Postgres connection string (pooled for Vercel)
- `DIRECT_URL` — Non-pooled Postgres connection string (for migrations)

---

## Deploy to Vercel

Atlas Academy is Vercel-ready. The repo includes `vercel.json`, a `postinstall` script that runs `prisma generate`, and a PostgreSQL-compatible Prisma schema.

### Step 1 — Provision a Postgres database

Pick one (all have free tiers):

| Provider | Free tier | Setup |
|----------|-----------|-------|
| **Vercel Postgres** | Hobby plan | Vercel dashboard → Storage → Create Database → Postgres |
| **Neon** (recommended) | 0.5 GB | https://neon.tech — create project, copy connection string |
| **Supabase** | 500 MB | https://supabase.com — create project → Settings → Database → URI |

### Step 2 — Set environment variables on Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | `postgresql://...?pgbouncer=true&connection_limit=1` | Pooled connection (for queries) |
| `DIRECT_URL` | `postgresql://...` | Non-pooled connection (for migrations) |

If using **Vercel Postgres**, Vercel auto-provides these when you link the database to your project. If using **Neon/Supabase**, set `DIRECT_URL` to the same string but without `?pgbouncer=true`.

### Step 3 — Deploy

```bash
# Option A: Push to GitHub (Vercel auto-deploys on push)
git push origin main

# Option B: Vercel CLI
npm i -g vercel
vercel link
vercel --prod
```

### Step 4 — Run the database migration + seed

After the first deploy, push the schema AND seed the curriculum content:

```bash
# Set both DATABASE_URL and DIRECT_URL in your local .env to point at your production DB, then:
bun run db:push
bun run db:seed
```

The seed script populates the database with:
- 9 skills (SKILLS_TAXONOMY)
- 19 foundation lessons (foundationLessons)
- 10 diagnostic questions
- 24 achievements

After seeding, ALL curriculum content is editable through the Knowledge Studio admin UI — no code changes or redeployment needed to add or edit lessons.

Or use Vercel CLI:
```bash
vercel env pull .env.production.local
bun run db:push
bun run db:seed
```

### Vercel-specific configuration in this repo

- **`vercel.json`** — build commands, function timeouts (the LLM coach route gets 30s max duration), telemetry opt-out
- **`postinstall` script** — runs `prisma generate` after `npm install` so the build can find the Prisma client
- **`build` script** — runs `prisma generate && next build` (no standalone copy commands that break on Vercel)
- **`next.config.ts`** — no `output: "standalone"` (Vercel handles output), `serverExternalPackages` for the `z-ai-web-dev-sdk`
- **Prisma schema** — uses `postgresql` provider with both `url` (pooled) and `directUrl` (non-pooled) for serverless compatibility
- **Prisma client** — singleton pattern with `globalThis` cache so warm serverless invocations reuse the connection

### Troubleshooting Vercel deploy

**"PrismaClientInitializationError: Can't reach database server"**
→ Your `DATABASE_URL` isn't set on Vercel, or the connection string is wrong. Verify in Settings → Environment Variables.

**"PrismaClientKnownRequestError: number of prepared statements exceeded"**
→ You're using a pooled connection (`?pgbouncer=true`) without `DIRECT_URL`. Add `DIRECT_URL` as a non-pooled connection string.

**Build fails with "Cannot find module '@prisma/client'"**
→ The `postinstall` script didn't run. Add `"postinstall": "prisma generate"` to `package.json` (already done in this repo).

**LLM Coach returns 500**
→ The `z-ai-web-dev-sdk` may need network access to Z.ai servers. Ensure the function has `maxDuration: 30` (configured in `vercel.json`). If it still fails, the route has a built-in fallback to rule-based responses.

**Cold start is slow**
→ Prisma client generation on cold start can add 1-2s. This is expected for serverless. Warm invocations are fast (~50-200ms).

---

## Database schema

16 Prisma models (PostgreSQL):
- `User` — profiles, roles, onboarding, XP, streaks
- `Session` — auth sessions
- `Lesson` — curriculum content (drafts + published)
- `Skill` — skill taxonomy
- `LearnerSkillMastery` — per-user skill states
- `Progress` — lesson completion records
- `AssessmentAttempt` — immutable quiz answers
- `DiagnosticAttempt` — placement test results
- `RevisionQueue` — spaced repetition schedule
- `SimOrder` — simulated forex trades
- `BinarySim` — binary options simulations
- `LearningSession` — study session tracking
- `SkillStateHistory` — append-only skill state transitions
- `Achievement` — badge catalog (24 entries)
- `UserAchievement` — per-user unlocks
- `AuditEvent` — administrative action log

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── auth/                 # Register / login / logout
│   │   ├── assessments/         # Submit quiz answers → skill mastery + achievements
│   │   ├── admin/lessons/        # Author + publish lessons
│   │   ├── diagnostic/          # Placement test evaluation
│   │   ├── coach/ask/            # LLM-powered AI coach
│   │   ├── onboarding/          # Save onboarding profile
│   │   ├── achievements/        # GET catalog + POST evaluate
│   │   ├── analytics/learning/  # Full analytics payload
│   │   ├── cron/skill-decay/     # Daily skill decay pass
│   │   └── simulation/
│   │       ├── orders/           # Place / close / modify forex trades
│   │       ├── binary/           # Binary options simulator
│   │       └── reset/            # Reset virtual account
│   ├── workspace/[section]/      # All workspace routes
│   ├── page.tsx                  # Homepage (dashboard)
│   ├── layout.tsx                # Root layout
│   └── globals.css               # ~3,600 lines of styles
├── components/
│   ├── Workspace.tsx             # Main app shell (nav + sections)
│   ├── TradingLab.tsx            # Candlestick replay + order placement
│   ├── RiskLaboratory.tsx        # 7-tab risk calculator
│   ├── BacktestArena.tsx         # 4-strategy backtester
│   ├── MonteCarloEquity.tsx      # Risk-of-ruin simulator
│   ├── BinaryOptionsLab.tsx      # Binary options educational lab
│   ├── SkillUniverse3D.tsx       # 3D rotating skill galaxy
│   ├── LearningAnalyticsDashboard.tsx
│   ├── AchievementsGallery.tsx   # 24-badge gallery
│   ├── AdaptiveOnboarding.tsx    # 4-step wizard
│   ├── InteractiveLessonPlayer.tsx
│   ├── DiagnosticModal.tsx
│   ├── RevisionDeck.tsx
│   ├── PublicPortal.tsx
│   └── ...
├── lib/
│   ├── auth.ts                   # Session + password hashing (scrypt)
│   ├── learning.ts               # Lesson + progress queries
│   ├── curriculum.ts             # Foundation lessons + skill taxonomy
│   ├── marketData.ts             # Synthetic candle data (5 instruments)
│   ├── achievements.ts           # Achievement engine (24 badges)
│   ├── lessonReordering.ts       # Style-based lesson reordering
│   └── db.ts                     # Prisma client
├── db/
│   ├── index.ts                  # Re-exports Prisma client
│   └── schema.ts                 # Legacy adapter (readJson/writeJson helpers)
└── prisma/
    └── schema.prisma             # Full database schema
```

---

## Educational principles

1. **Education before execution** — users learn the concept before attempting simulated trades
2. **Demonstrated mastery over time spent** — completing a video doesn't prove understanding
3. **Process quality over financial outcome** — a profitable trade without a stop loss is still bad process
4. **Simulation before any real-money consideration** — strictly educational, virtual funds only
5. **Transparent assessments** — learners can understand why they passed, failed, or received a recommendation
6. **Safety and honesty** — no guaranteed-profit claims, no fabricated performance results, no AI trading predictions

---

## License

Educational project. Not financial advice. No real-money trading functionality.

© 2026 Atlas Academy
