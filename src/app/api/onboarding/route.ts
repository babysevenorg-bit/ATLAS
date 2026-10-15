import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getUser } from "@/lib/auth";
import { writeJson } from "@/db/schema";
import { evaluateAndAwardAchievements } from "@/lib/achievements";

// GET — return current user's onboarding profile
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const full = await db.user.findUnique({
      where: { id: user.id },
      select: {
        onboardingCompleted: true,
        learningGoal: true,
        dailyGoalMinutes: true,
        learningStyle: true,
        studyReminderHour: true,
      },
    });
    return NextResponse.json(full || {});
  } catch {
    return NextResponse.json({ error: "Failed to load onboarding profile." }, { status: 500 });
  }
}

// POST — save onboarding profile (called when wizard completes)
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Sign in to save your profile." }, { status: 401 });

    const body = await request.json();
    const learningGoal = String(body.learningGoal || "").slice(0, 30);
    const dailyGoalMinutes = Math.max(5, Math.min(120, Number(body.dailyGoalMinutes) || 20));
    const learningStyle = String(body.learningStyle || "mixed").slice(0, 20);
    const studyReminderHour =
      body.studyReminderHour === null || body.studyReminderHour === undefined
        ? null
        : Math.max(0, Math.min(23, Number(body.studyReminderHour)));

    await db.user.update({
      where: { id: user.id },
      data: {
        onboardingCompleted: true,
        learningGoal,
        dailyGoalMinutes,
        learningStyle,
        studyReminderHour,
      },
    });

    // Record an audit event for the onboarding completion
    await db.auditEvent.create({
      data: {
        id: crypto.randomUUID(),
        actorId: user.id,
        action: "onboarding.completed",
        subjectId: user.id,
        details: writeJson({ learningGoal, dailyGoalMinutes, learningStyle, studyReminderHour }),
      },
    });

    // Create a learning session entry to mark the onboarding event
    await db.learningSession.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        startedAt: new Date(),
        endedAt: new Date(),
        durationSec: 0,
        lessonsCompleted: 0,
        assessmentsAnswered: 0,
        xpEarned: 25, // Welcome bonus XP for completing onboarding
        activityType: "study",
      },
    });

    // Bump XP for completing onboarding
    await db.user.update({
      where: { id: user.id },
      data: { experiencePoints: { increment: 25 } },
    });

    // Evaluate achievements (onboarding_complete trigger)
    const newlyAwarded = await evaluateAndAwardAchievements(user.id).catch(() => []);

    return NextResponse.json({
      ok: true,
      xpAwarded: 25,
      newlyAwardedAchievements: newlyAwarded.map(a => ({
        code: a.achievement.code,
        name: a.achievement.name,
        tier: a.achievement.tier,
        xpReward: a.achievement.xpReward,
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to save onboarding.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
