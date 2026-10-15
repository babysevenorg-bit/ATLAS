# Atlas Academy — Technical Specification
Version 2.0 · October 2026

## 1. System Architecture
Next.js App Router (Turbopack) + TypeScript + Tailwind CSS with server-rendered workspace routes, Drizzle ORM, and PostgreSQL. Client-side authentication derives identity strictly from HTTP-only session cookies with SHA-256 tokens and scrypt password hashing.

## 2. Database Schema (`src/db/schema.ts`)
- `users`: User identity, email, hashed credentials, role (`learner`, `editor`, `administrator`, `owner`), active persona (`beginner`, `developing`, `advanced`), virtual balance ($10,000 default), experience points, streak days, and timestamps.
- `sessions`: Session records with SHA-256 token digest, user foreign key, and 30-day expiration.
- `lessons`: Curated built-in and dynamically authored curriculum modules with title, slug, learning path ID, category, level, duration, sort order, content, takeaway, verification questions, prerequisite ID, skill associations, publication status (`draft`, `published`, `archived`), and version.
- `skills`: Measurable learning outcomes taxonomy with code, name, description, category, and prerequisite skill IDs.
- `learnerSkillMastery`: User skill state (`not_started`, `learning`, `developing`, `practising`, `demonstrated`, `needs_revision`), evidence scores, and last assessed timestamps.
- `progress`: User lesson progress, completion status, attempts, scores, and updated timestamps.
- `assessmentAttempts`: Append-only immutable record of student quiz submissions and scores.
- `diagnosticAttempts`: Student diagnostic scores, category breakdown, assigned persona level, and recorded responses.
- `revisionQueue`: Spaced repetition items tracking interval days, ease factor, repetition count, and scheduled due dates.
- `simOrders`: Simulated Forex orders with symbol, direction (`BUY`/`SELL`), order type (`MARKET`/`LIMIT`), lot size, entry price, close price, SL, TP, status (`OPEN`/`CLOSED`), realized P&L, pips, open/close timestamps, setup journal notes, and process discipline score (0–100).
- `binarySims`: Educational binary option simulations with asset, direction (`CALL`/`PUT`), stake, strike price, expiry price, expiry seconds, payout percentage, outcome (`WIN`/`LOSS`/`TIE`), return amount, net P&L, and calculated expected value.
- `auditEvents`: Administrative action logs with actor ID, action type, subject ID, and JSON details.

## 3. Application API Routes
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth` | User registration, sign-in, and session logout. |
| `POST` | `/api/assessments` | Submits lesson quiz, updates progress, updates skill mastery state, schedules spaced revision, and awards XP. |
| `POST` | `/api/diagnostic` | Evaluates 10 diagnostic questions, assigns Persona level, and unlocks foundational chapters for advanced learners. |
| `POST` | `/api/coach/ask` | Contextual AI Learning Coach inquiry with approved lesson retrieval, post-trade debriefs, and safety guardrails. |
| `GET` | `/api/simulation/orders` | Retrieves user's open and closed simulated Forex positions and virtual balance. |
| `POST` | `/api/simulation/orders` | Validates and submits simulated Forex orders with margin requirement checks and lot sizing bounds. |
| `POST` | `/api/simulation/orders/close` | Closes simulated Forex position, computes realized P&L and pip differential, and scores process execution discipline. |
| `POST` | `/api/simulation/binary` | Simulates binary option contract resolution against price feed with live Expected Value math. |
| `POST` | `/api/simulation/reset` | Resets virtual account balance to $10,000 and clears simulated trading history. |
| `GET` | `/api/admin/lessons` | Lists all authored curriculum drafts (restricted to administrator/editor roles). |
| `POST` | `/api/admin/lessons` | Creates a new draft lesson and records an administrative audit event. |
| `PATCH` | `/api/admin/lessons` | Updates lesson publication status (`published`/`draft`) and increments version counter. |
| `GET` | `/api/health` | Service health probe. |
