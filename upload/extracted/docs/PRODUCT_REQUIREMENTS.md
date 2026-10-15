# Atlas Academy — Product Requirements Document
Version 2.0 (Advanced Release) · October 2026

## Product Vision & Principles
Atlas Academy is an adaptive, self-evolving financial education workspace that teaches trading concepts from absolute zero, measures demonstrated skill mastery through deterministic assessment criteria, guides historical replay training with zero look-ahead bias, and embeds mathematical defense of capital before any simulated trade execution.

## User Personas
- **Persona A — Complete Beginner:** Guided from zero with foundational quote conventions, base vs quote currencies, pips, spreads, lot sizes, and protective stop loss mechanics.
- **Persona B — Developing Learner:** Explores market structure (swing highs/lows, support & resistance), technical indicators and their lagging limitations, position sizing calculators, and risk-to-reward ratios.
- **Persona C — Advanced Practitioner:** Engages in historical candlestick replay, backtesting scenarios, drawdown asymmetry recovery modeling, and trade post-mortem process evaluations.
- **Platform Administrator / Content Editor:** Authors, validates, versions, and publishes courses, chapters, and multi-question verification quizzes dynamically through the Knowledge Studio.

## Completed Core Pillars & Modules

### 1. Academy Curriculum Pathways
- **Path 1: Forex Foundations:** Market participants, currency pair notation (Base vs Quote), pips and spread friction, lot sizes, leverage realities, and order types (Market, Limit, Stop, SL/TP).
- **Path 2: Market Structure & Technical Analysis:** Candlestick OHLC anatomy, multi-timeframe analysis, swing structure (Higher Highs & Higher Lows), horizontal support & resistance zones, role reversals, and indicator lag limitations.
- **Path 3: Risk Management Laboratory:** The 1% risk rule, precision position sizing formula ($Lots = \frac{\text{Risk}}{\text{Stop Pips} \times \text{Pip Value}}$), Reward-to-Risk ratios, and drawdown asymmetry recovery math.
- **Path 4: Trading Psychology & Execution Discipline:** Process quality vs outcome bias, eliminating revenge trading and emotional tilt, and mandatory plan-first decision journaling.
- **Path 5: Binary Options Educational Pathway:** Distinct educational study covering all-or-nothing contract mechanics, fixed payouts, break-even win rate calculation ($\frac{\text{Stake}}{\text{Stake}+\text{Payout}}$), negative expected value ($-EV$), 60-second micro noise, and global regulatory restrictions (FCA, ESMA, ASIC).

### 2. Historical Replay Simulator (Trading Lab)
- Interactive multi-asset candlestick engine for EUR/USD, GBP/USD, and USD/JPY with authentic historical scenarios.
- Complete look-ahead bias prevention: Future price bars remain obscured until the learner advances time bar-by-bar or triggers simulated entries.
- Overlays for SMA 20, EMA 50, and 14-period RSI subchart.
- Integrated Position Sizing Assistant embedded directly in the order ticket.
- Plan-First Decision Journal: Requires recording technical setup rationale before order placement.
- Automated Post-Trade Process Review scoring process discipline (100 pts) separately from random monetary outcome.

### 3. Binary Options Probability Laboratory
- Simulated high-frequency tick chart with configurable expiry windows (30s, 60s, 2m, 5m).
- Real-time strike price visual overlays and countdown timers.
- Interactive Expected Value (EV) calculation demonstrating why 80% payout contracts lose $-10 per $100 trade under fair 50/50 probability.
- Statistical sample tracking comparing empirical win rate against the theoretical 55.56% break-even threshold.

### 4. Risk Management Interactive Suite
- Dynamic Position Sizing Calculator with Standard, Mini, and Micro lot allocations and margin calculations.
- Monte Carlo / Binomial Losing Streak Probability Simulator modeling 3, 5, and 8 consecutive loss probabilities over sample sizes.
- Reward-to-Risk & Mathematical Expectancy Matrix ($+EV$ vs $-EV$).
- Exponential Drawdown Recovery Curve Calculator.

### 5. Adaptive Placement & Spaced Repetition
- 10-Question Diagnostic Assessment Engine categorizing learner placement (Persona A, B, or C) and auto-unlocking mastered foundational topics.
- Daily Knowledge Revision Queue powered by SuperMemo SM-2 spaced repetition principles.
- 6-State Measurable Skill Mastery System: Not Started, Learning, Developing, Practising, Demonstrated, and Needs Revision.

### 6. AI Learning Coach
- Context-aware retrieval engine connected to approved Academy curriculum.
- Specific post-trade debrief assistant and formula solver.
- Transparent ethical guardrails: Refuses price forecasts, hot picks, trade signals, or guaranteed profit claims.

### 7. Administrator Knowledge Studio
- Graphical editor for creating and updating learning paths, categories, estimated durations, and markdown content.
- Multi-option verification quiz builder with prerequisite selector.
- Live draft publishing workflow with version tracking and immutable administrative audit logs.
