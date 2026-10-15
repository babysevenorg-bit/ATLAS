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
- SQLite (bundled with the dev environment)

### Install & run
```bash
bun install
bun run db:push    # Create SQLite database + schema
bun run dev        # Start dev server on http://localhost:3000
```

### Environment
Create a `.env` file:
```
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

---

## Database schema

12 Prisma models:
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
