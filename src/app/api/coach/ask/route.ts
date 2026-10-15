import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getPublishedLessons } from "@/lib/learning";
import { evaluateAndAwardAchievements, getAchievementProgress } from "@/lib/achievements";
import { SKILLS_TAXONOMY } from "@/lib/curriculum";
import { db } from "@/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // give the LLM up to 30s to respond

// Hard guardrail patterns — short-circuit before calling the LLM
const FORBIDDEN_PATTERNS = [
  /will .* (go up|go down|rise|fall|rally|dump)/i,
  /should i (buy|sell)/i,
  /buy or sell/i,
  /hot pick/i,
  /guaranteed profit/i,
  /predict.*price/i,
  /live signal/i,
  /which.*pair.*best.*today/i,
];

const FORBIDDEN_RESPONSE = {
  answer:
    "⚠️ **Educational Boundary Disclosure**\n\nAs an AI Learning Coach, I never predict real-time market prices, provide trading signals, or offer personalized financial advice. Markets are fundamentally uncertain. In Atlas Academy, we focus on building risk management discipline, position sizing precision, and technical literacy through virtual simulations.\n\nI can explain concepts (pips, spreads, R:R), help you interpret a simulated trade, recommend lessons based on your skill gaps, or walk through the mathematics of risk. What would you like to understand?",
  relatedLessons: [
    { id: "process-over-outcomes", title: "Process Over Outcomes" },
    { id: "risk-per-trade", title: "The 1% Rule" },
  ],
};

type TradeContext = {
  symbol: string;
  type: string;
  lots: number;
  openPrice: number;
  closePrice: number | null;
  pnl: number;
  sl: number | null;
  tp: number | null;
  planFollowed: boolean | null;
  processScore: number | null;
};

async function buildUserContext(userId: string) {
  const [user, progress, skillMastery, recentTrades, achievements] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { experiencePoints: true, streakDays: true, persona: true, learningStyle: true, learningGoal: true, onboardingCompleted: true },
    }),
    db.progress.findMany({ where: { userId, completed: true }, select: { lessonId: true } }),
    db.learnerSkillMastery.findMany({ where: { userId }, select: { skillId: true, state: true, evidenceScore: true, lastAssessedAt: true } }),
    db.simOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { symbol: true, type: true, lots: true, openPrice: true, closePrice: true, pnl: true, sl: true, tp: true, planFollowed: true, processScore: true, status: true },
    }),
    getAchievementProgress(userId),
  ]);

  const demonstratedSkills = skillMastery.filter(s => s.state === "demonstrated").map(s => s.skillId);
  const needsRevisionSkills = skillMastery.filter(s => s.state === "needs_revision").map(s => s.skillId);
  const developingSkills = skillMastery.filter(s => ["learning", "developing", "practising"].includes(s.state)).map(s => s.skillId);
  const unlockedAchievements = achievements.filter(a => a.unlocked).map(a => a.def.name);

  return {
    xp: user?.experiencePoints || 0,
    streak: user?.streakDays || 1,
    persona: user?.persona || "beginner",
    learningStyle: user?.learningStyle || "mixed",
    learningGoal: user?.learningGoal || "unspecified",
    lessonsCompleted: progress.length,
    demonstratedSkillIds: demonstratedSkills,
    developingSkillIds: developingSkills,
    needsRevisionSkillIds: needsRevisionSkills,
    recentTrades: recentTrades as TradeContext[],
    unlockedAchievements,
    onboardingComplete: user?.onboardingCompleted || false,
  };
}

function buildSystemPrompt(
  ctx: Awaited<ReturnType<typeof buildUserContext>>,
  lessons: Awaited<ReturnType<typeof getPublishedLessons>>,
  tradeDetails?: TradeContext
): string {
  // Skill code → name lookup
  const skillNameMap = new Map(SKILLS_TAXONOMY.map(s => [s.id, `${s.code} (${s.name})`]));
  const demonstratedNames = ctx.demonstratedSkillIds.map(id => skillNameMap.get(id) || id).join(", ") || "none yet";
  const developingNames = ctx.developingSkillIds.map(id => skillNameMap.get(id) || id).join(", ") || "none";
  const revisionNames = ctx.needsRevisionSkillIds.map(id => skillNameMap.get(id) || id).join(", ") || "none";

  // Recommend next lessons based on skill gaps
  const nextLessonRecs = lessons
    .filter(l => !l.skillIds.every(sId => ctx.demonstratedSkillIds.includes(sId)))
    .slice(0, 3)
    .map(l => `- ${l.title} (teaches: ${l.skillIds.map(id => skillNameMap.get(id) || id).join(", ")})`)
    .join("\n");

  // Recent trades summary
  const tradesSummary = ctx.recentTrades.length > 0
    ? ctx.recentTrades.map(t =>
        `- ${t.symbol} ${t.type} ${t.lots}L ${t.status === "CLOSED" ? `closed $${t.pnl.toFixed(2)}` : "open"} (process score: ${t.processScore ?? "n/a"}, SL: ${t.sl ? "yes" : "NO"})`
      ).join("\n")
    : "no simulated trades yet";

  return `You are the Atlas Academy AI Learning Coach — an educational assistant for a forex & binary options learning platform. You teach trading concepts to learners from absolute zero.

# HARD GUARDRAILS (non-negotiable)
1. NEVER predict real-time or future market prices.
2. NEVER provide trading signals, "hot picks", or recommendations to buy/sell specific instruments.
3. NEVER encourage a learner to recover losses by increasing risk.
4. NEVER claim a simulated result proves a repeatable edge.
5. NEVER provide personalized financial advice.
6. All explanations are educational. Markets are uncertain. Past performance never guarantees future results.
7. If a learner asks for predictions or specific trade recommendations, refuse and redirect to risk management and process discipline.

# YOUR ROLE
- Explain trading concepts in beginner-friendly language.
- Offer alternative explanations when a learner is confused.
- Reference the learner's actual progress (skills, lessons, trades) to make explanations personal.
- Recommend lessons based on their demonstrated skill gaps.
- Help interpret simulated trade outcomes (process quality vs financial outcome).
- Praise disciplined process, not profitable outcomes. Criticize undisciplined process, even if it was profitable.
- Use Markdown formatting for clarity (headings, bold, lists, code blocks for formulas).

# LEARNER CONTEXT (use this to personalize your response)
- XP: ${ctx.xp} (Level ${Math.floor(ctx.xp / 100) + 1})
- Streak: ${ctx.streak} days
- Persona: ${ctx.persona}
- Learning style: ${ctx.learningStyle}
- Learning goal: ${ctx.learningGoal}
- Onboarding complete: ${ctx.onboardingComplete ? "yes" : "no"}
- Lessons completed: ${ctx.lessonsCompleted}
- Demonstrated skills: ${demonstratedNames}
- Skills in progress: ${developingNames}
- Skills needing revision (decay risk): ${revisionNames}
- Recent simulated trades:
${tradesSummary}
- Achievements unlocked (${ctx.unlockedAchievements.length}): ${ctx.unlockedAchievements.join(", ") || "none yet"}

${tradeDetails ? `# SPECIFIC TRADE UNDER REVIEW
${tradeDetails.symbol} ${tradeDetails.type} ${tradeDetails.lots} lots
Entry: ${tradeDetails.openPrice} | Exit: ${tradeDetails.closePrice ?? "still open"} | PnL: $${tradeDetails.pnl.toFixed(2)}
Stop Loss: ${tradeDetails.sl ?? "NONE — critical process violation"} | Take Profit: ${tradeDetails.tp ?? "none"}
Plan followed: ${tradeDetails.planFollowed ? "yes" : "no"} | Process score: ${tradeDetails.processScore ?? "n/a"}/100

When reviewing this trade, separate PROCESS QUALITY from FINANCIAL OUTCOME. A profitable trade made without a stop loss is still bad process. A losing trade with disciplined risk control is still good process.` : ""}

# RECOMMENDED NEXT LESSONS (suggest these if relevant)
${nextLessonRecs || "- Continue with the curriculum"}

# RESPONSE STYLE
- Be warm but precise. Avoid hype.
- Use concrete numbers from the learner's actual data when relevant.
- Cite specific skills by their code (e.g. "your RK-SIZE skill is developing") when giving personalized guidance.
- Keep responses under 350 words unless the learner explicitly asks for depth.
- End with a single clear next step the learner can take.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = String(body.question || "").trim();
    const contextType = body.contextType || "general";
    const tradeDetails: TradeContext | undefined = body.tradeDetails;

    if (!query) {
      return NextResponse.json({ error: "Please enter a question or topic." }, { status: 400 });
    }

    // 1. Hard guardrail check — short-circuit before LLM
    if (FORBIDDEN_PATTERNS.some(p => p.test(query))) {
      return NextResponse.json(FORBIDDEN_RESPONSE);
    }

    // 2. Build user context (if authenticated)
    const user = await getUser();
    const lessons = await getPublishedLessons();
    const userCtx = user ? await buildUserContext(user.id) : null;

    const systemPrompt = userCtx
      ? buildSystemPrompt(userCtx, lessons, tradeDetails)
      : `You are the Atlas Academy AI Learning Coach. Explain trading concepts in beginner-friendly language. NEVER predict prices or provide trading signals. Use Markdown. Keep responses under 350 words.`;

    // 3. Call the LLM via z-ai-web-dev-sdk
    let llmAnswer: string;
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: systemPrompt },
          { role: "user", content: query },
        ],
        thinking: { type: "disabled" },
      });
      llmAnswer = completion.choices[0]?.message?.content || "";
      if (!llmAnswer) throw new Error("Empty LLM response");
    } catch (llmErr) {
      // Fallback to the legacy rule-based response if the LLM is unavailable
      console.error("LLM call failed, falling back to rule-based:", llmErr);
      llmAnswer = fallbackRuleBasedAnswer(query, lessons);
    }

    // 4. Find related lessons via keyword matching
    const lowerQuery = query.toLowerCase();
    const related = lessons
      .map(l => {
        let score = 0;
        const searchSpace = `${l.title} ${l.description} ${l.takeaway}`.toLowerCase();
        const terms = lowerQuery.split(/\W+/).filter(t => t.length > 2);
        terms.forEach(t => {
          if (l.title.toLowerCase().includes(t)) score += 5;
          if (l.takeaway.toLowerCase().includes(t)) score += 3;
          if (searchSpace.includes(t)) score += 1;
        });
        return { lesson: l, score };
      })
      .sort((a, b) => b.score - a.score)
      .filter(item => item.score > 1)
      .slice(0, 3)
      .map(item => ({ id: item.lesson.id, title: item.lesson.title }));

    const relatedLessons = related.length > 0
      ? related
      : [
          { id: "what-is-forex", title: "What is the Forex Market?" },
          { id: "risk-per-trade", title: "The 1% Rule" },
        ];

    // 5. Evaluate achievements (the user interacted with the coach — counts as engagement)
    if (user) {
      await evaluateAndAwardAchievements(user.id).catch(() => {});
    }

    return NextResponse.json({
      answer: llmAnswer,
      relatedLessons,
      poweredByLLM: true,
      contextUsed: !!userCtx,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Learning Coach is currently unavailable. Please try again.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Legacy rule-based fallback — used only if the LLM is unreachable
function fallbackRuleBasedAnswer(query: string, lessons: { title: string; description: string; takeaway: string; content: string }[]): string {
  const lowerQuery = query.toLowerCase();
  if (/pip|spread/i.test(lowerQuery)) {
    return "A **Pip** (Percentage in Point) is 0.0001 in standard 4-decimal currency pairs like EUR/USD (or 0.01 in JPY pairs). The **Spread** is the difference between the buying price (Ask) and selling price (Bid). It is a transaction cost you pay on every trade.";
  }
  if (/position size|lot/i.test(lowerQuery)) {
    return "The **Position Sizing Formula** connects risk budget and stop distance: `Lots = Risk Budget ($) / [Stop Distance (Pips) × Pip Value ($)]`. For instance, with a $100 risk budget and 20-pip stop on EUR/USD ($10/pip), Lots = $100 / (20 × $10) = 0.50 standard lots.";
  }
  if (/binary option|expiry|payout/i.test(lowerQuery)) {
    return "In **Binary Options**, contracts are all-or-nothing with fixed expiry windows. Because winning payouts are capped at ~80% while losing trades forfeit 100% of the stake, the break-even win rate is an unsustainable **55.56%**, creating a heavy structural negative expected value.";
  }
  if (/drawdown/i.test(lowerQuery)) {
    return "Account **Drawdown** is asymmetric: losing 10% requires an 11% gain to break even, but losing 50% requires a **100% gain** (doubling your capital). That is why defending capital with the 1% risk rule is vital.";
  }
  const bestMatch = lessons
    .map(l => ({ l, score: lowerQuery.split(/\W+/).filter(t => t.length > 2).reduce((s, t) => s + (l.title.toLowerCase().includes(t) ? 5 : (l.takeaway.toLowerCase().includes(t) ? 3 : 0)), 0) }))
    .sort((a, b) => b.score - a.score)[0];
  if (bestMatch && bestMatch.score > 2) {
    return `### ${bestMatch.l.title}\n\n${bestMatch.l.takeaway}\n\n${bestMatch.l.content.slice(0, 400)}...\n\nStudy the complete interactive lesson in the Academy for the full walkthrough and quiz assessment.`;
  }
  return "That is a great trading inquiry! As you study through the Academy curriculum, you'll connect terminology, technical market structure, risk calculations, and trade psychology into an integrated workflow. Feel free to ask about pips, lot sizing, support & resistance, drawdowns, or binary options mathematics!";
}
