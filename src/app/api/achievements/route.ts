import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { evaluateAndAwardAchievements, getAchievementProgress } from "@/lib/achievements";

export const dynamic = "force-dynamic";

// GET — return the user's achievement progress (catalog + unlocks + progress)
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const progress = await getAchievementProgress(user.id);
    return NextResponse.json({
      achievements: progress,
      totalUnlocked: progress.filter(p => p.unlocked).length,
      totalAvailable: progress.length,
      totalXpFromAchievements: progress
        .filter(p => p.unlocked)
        .reduce((s, p) => s + p.def.xpReward, 0),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Achievement lookup failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST — evaluate and award any newly-earned achievements
// Body: { trigger?: 'assessment' | 'trade' | 'diagnostic' | 'onboarding' | 'manual' }
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const trigger = String(body?.trigger || "manual");

    const newlyAwarded = await evaluateAndAwardAchievements(user.id);

    return NextResponse.json({
      ok: true,
      trigger,
      newlyAwarded: newlyAwarded.map(a => ({
        id: a.achievement.id,
        code: a.achievement.code,
        name: a.achievement.name,
        description: a.achievement.description,
        tier: a.achievement.tier,
        iconKey: a.achievement.iconKey,
        xpReward: a.achievement.xpReward,
        contextValue: a.contextValue,
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Achievement evaluation failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
