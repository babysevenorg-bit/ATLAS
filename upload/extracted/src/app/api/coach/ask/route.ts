import { NextRequest, NextResponse } from "next/server";
import { getPublishedLessons } from "@/lib/learning";
import { DIAGNOSTIC_QUESTIONS, SKILLS_TAXONOMY } from "@/lib/curriculum";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = String(body.question || "").trim();
    const contextType = body.contextType || "general"; // 'general' | 'trade_review' | 'chart_help' | 'risk_calc'
    const tradeDetails = body.tradeDetails;

    if (!query) {
      return NextResponse.json({ error: "Please enter a question or topic." }, { status: 400 });
    }

    const lowerQuery = query.toLowerCase();

    // 1. Guardrail checks for safety and honesty
    if (/will .* (go up|go down|rise|fall|rally|dump)|should i (buy|sell)|buy or sell|hot pick|guaranteed profit|predict.*price|live signal/i.test(lowerQuery)) {
      return NextResponse.json({
        answer: "⚠️ **Educational Boundary Disclosure:**\nAs an AI Learning Coach, I never predict real-time market prices, provide trading signals, or offer financial advice. Markets are fundamentally uncertain. In this Academy, we focus on building risk management discipline, position sizing precision, and technical literacy through virtual simulations.",
        relatedLessons: [{ id: "process-over-outcomes", title: "Process Over Outcomes" }, { id: "risk-per-trade", title: "The 1% Rule" }],
      });
    }

    // 2. Specific Contextual Handlers
    if (contextType === "trade_review" && tradeDetails) {
      const { symbol, type, lots, openPrice, closePrice, pnl, sl, tp, planFollowed } = tradeDetails;
      const hadStop = !!sl;
      const isProfitable = (pnl || 0) > 0;

      let debrief = `### 📊 Simulated Trade Post-Mortem: ${symbol} (${type} ${lots} lots)\n\n`;
      debrief += `**Execution Summary:** Entry: ${openPrice} | Exit: ${closePrice} | Virtual Result: ${pnl >= 0 ? '+$' + pnl : '-$' + Math.abs(pnl)}\n\n`;

      if (hadStop) {
        debrief += `✅ **Risk Safeguard Maintained:** You placed a protective Stop Loss (${sl}). This demonstrates sound risk discipline.\n`;
      } else {
        debrief += `❌ **Critical Process Violation:** You entered without a predefined Stop Loss. In live market conditions, a sudden news spike could cause severe account drawdown or margin call.\n`;
      }

      if (isProfitable && !hadStop) {
        debrief += `\n⚠️ **Beware of Outcome Bias:** This trade yielded a virtual gain, but it succeeded despite breaking risk rules. Do not allow short-term luck to reinforce poor habits!`;
      } else if (!isProfitable && hadStop) {
        debrief += `\n🎯 **Excellent Process Discipline:** Even though this trade was stopped out for a loss, you executed according to your predefined risk budget. In probabilistic trading, taking planned small losses is part of the business model!`;
      }

      return NextResponse.json({
        answer: debrief,
        relatedLessons: [
          { id: "process-over-outcomes", title: "Process Over Outcomes" },
          { id: "position-sizing-formula", title: "Position Sizing Formula" }
        ]
      });
    }

    // 3. Knowledge Base Retrieval Search
    const lessons = await getPublishedLessons();
    const scoredLessons = lessons.map(l => {
      let score = 0;
      const searchSpace = `${l.title} ${l.description} ${l.content} ${l.takeaway}`.toLowerCase();
      const terms = lowerQuery.split(/\W+/).filter(t => t.length > 2);
      
      terms.forEach(t => {
        if (l.title.toLowerCase().includes(t)) score += 5;
        if (l.takeaway.toLowerCase().includes(t)) score += 3;
        if (searchSpace.includes(t)) score += 1;
      });

      return { lesson: l, score };
    }).sort((a, b) => b.score - a.score);

    const bestMatch = scoredLessons[0]?.score > 2 ? scoredLessons[0].lesson : null;

    let responseText = "";
    if (bestMatch) {
      responseText = `### 💡 ${bestMatch.title}\n\n${bestMatch.takeaway}\n\n${bestMatch.content.slice(0, 450)}...\n\n👉 *Study the complete interactive lesson in the Academy for full walkthrough and quiz assessment.*`;
    } else {
      // General trading query response
      if (/pip|spread/i.test(lowerQuery)) {
        responseText = "A **Pip** (Percentage in Point) is 0.0001 in standard 4-decimal currency pairs like EUR/USD (or 0.01 in JPY pairs). The **Spread** is the difference between the buying price (Ask) and selling price (Bid).";
      } else if (/position size|lot/i.test(lowerQuery)) {
        responseText = "The **Position Sizing Formula** connects risk budget and stop distance: \n$$\\text{Lots} = \\frac{\\text{Risk Budget (\\$)}}{\\text{Stop Distance (Pips)} \\times \\text{Pip Value (\\$)}}$$\nFor instance, with a $100 risk budget and 20-pip stop on EUR/USD ($10/pip), Lots = $100 / (20 × $10) = 0.50 standard lots.";
      } else if (/binary option|expiry|payout/i.test(lowerQuery)) {
        responseText = "In **Binary Options**, contracts are all-or-nothing with fixed expiry windows (e.g. 60s). Because winning payouts are capped at ~80% while losing trades forfeit 100% of the stake, the break-even win rate is an unsustainable **55.56%**, creating a heavy structural negative expected value.";
      } else if (/drawdown/i.test(lowerQuery)) {
        responseText = "Account **Drawdown** is asymmetric: losing 10% requires an 11% gain to break even, but losing 50% requires a **100% gain** (doubling your capital). That is why defending capital with the 1% risk rule is vital.";
      } else {
        responseText = "That is a great trading inquiry! As you study through the Academy curriculum, you'll connect terminology, technical market structure, risk calculations, and trade psychology into an integrated workflow. Feel free to ask about pips, lot sizing, support & resistance, drawdowns, or binary options mathematics!";
      }
    }

    const related = scoredLessons.slice(0, 2).filter(item => item.score > 1).map(item => ({
      id: item.lesson.id,
      title: item.lesson.title,
    }));

    return NextResponse.json({
      answer: responseText,
      relatedLessons: related.length ? related : [
        { id: "what-is-forex", title: "What is the Forex Market?" },
        { id: "risk-per-trade", title: "The 1% Rule" }
      ],
    });
  } catch {
    return NextResponse.json({ error: "Learning Coach is currently unavailable. Please try again." }, { status: 500 });
  }
}
