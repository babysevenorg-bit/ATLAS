import { NextResponse } from "next/server";
import { db } from "@/db";
import { getUser } from "@/lib/auth";
import { SKILLS_TAXONOMY } from "@/lib/curriculum";
import { readJson } from "@/db/schema";

const MASTERY_COLORS: Record<string, string> = {
  not_started: "#7c8b86",
  learning: "#74c0fc",
  developing: "#ffd43b",
  practising: "#ff922b",
  demonstrated: "#69db7c",
  needs_revision: "#ff6b6b",
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    // Fetch all learning data in parallel
    const [
      userData,
      learningSessions,
      skillMastery,
      skillHistory,
      progressRecords,
      assessmentAttempts,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: { experiencePoints: true, streakDays: true, createdAt: true },
      }),
      db.learningSession.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: "desc" },
      }),
      db.learnerSkillMastery.findMany({ where: { userId: user.id } }),
      db.skillStateHistory.findMany({
        where: { userId: user.id },
        orderBy: { recordedAt: "desc" },
        take: 20,
      }),
      db.progress.findMany({ where: { userId: user.id } }),
      db.assessmentAttempt.findMany({ where: { userId: user.id } }),
    ]);

    const xp = userData?.experiencePoints || 0;
    const level = Math.floor(xp / 100) + 1;

    // Heatmap (12 weeks × 7 days = 84 cells)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const heatmap: { date: string; intensity: number; xp: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      // Find sessions on this date
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setUTCDate(date.getUTCDate() + 1);
      const dayXp = learningSessions
        .filter(s => s.startedAt >= dayStart && s.startedAt < dayEnd)
        .reduce((sum, s) => sum + s.xpEarned, 0);
      let intensity = 0;
      if (dayXp >= 100) intensity = 4;
      else if (dayXp >= 50) intensity = 3;
      else if (dayXp >= 25) intensity = 2;
      else if (dayXp > 0) intensity = 1;
      heatmap.push({ date: dateStr, intensity, xp: dayXp });
    }

    // XP timeline (last 14 days)
    const xpTimeline: { date: string; xp: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setUTCDate(date.getUTCDate() + 1);
      const dayXp = learningSessions
        .filter(s => s.startedAt >= dayStart && s.startedAt < dayEnd)
        .reduce((sum, s) => sum + s.xpEarned, 0);
      xpTimeline.push({ date: dateStr, xp: dayXp });
    }

    // Mastery distribution across all SKILLS_TAXONOMY entries
    const masteryStates = ["not_started", "learning", "developing", "practising", "demonstrated", "needs_revision"];
    const masteryDistribution = masteryStates.map(state => ({
      state,
      count: SKILLS_TAXONOMY.filter(skill => {
        const rec = skillMastery.find(m => m.skillId === skill.id);
        return rec ? rec.state === state : state === "not_started";
      }).length,
      color: MASTERY_COLORS[state],
    }));

    // Retention buckets — group demonstrated skills by last-assessed age
    const retentionBuckets = [
      { label: "Last 24 hours", count: 0, decayRisk: "low" as const },
      { label: "Last 7 days", count: 0, decayRisk: "low" as const },
      { label: "7-14 days", count: 0, decayRisk: "medium" as const },
      { label: "14-30 days", count: 0, decayRisk: "medium" as const },
      { label: "30+ days", count: 0, decayRisk: "high" as const },
      { label: "Never assessed", count: 0, decayRisk: "low" as const },
    ];
    const now = Date.now();
    skillMastery.forEach(m => {
      const ageHours = (now - m.lastAssessedAt.getTime()) / (1000 * 60 * 60);
      if (m.state === "demonstrated" || m.state === "practising") {
        if (ageHours < 24) retentionBuckets[0].count++;
        else if (ageHours < 24 * 7) retentionBuckets[1].count++;
        else if (ageHours < 24 * 14) retentionBuckets[2].count++;
        else if (ageHours < 24 * 30) retentionBuckets[3].count++;
        else retentionBuckets[4].count++;
      } else if (m.state === "needs_revision") {
        retentionBuckets[4].count++; // overdue
      } else {
        retentionBuckets[5].count++;
      }
    });

    // Recent transitions
    const recentTransitions = skillHistory.map(h => ({
      skillId: h.skillId,
      previousState: h.previousState,
      newState: h.newState,
      delta: h.evidenceScoreDelta,
      trigger: h.triggerActivity,
      recordedAt: h.recordedAt.toISOString(),
    }));

    // Streak calculation (compute longest streak from heatmap)
    let currentStreak = 0;
    let longestStreak = 0;
    let runningStreak = 0;
    for (let i = heatmap.length - 1; i >= 0; i--) {
      if (heatmap[i].intensity > 0) {
        if (currentStreak === 0 || i === heatmap.length - 1) currentStreak++;
        else if (heatmap[i + 1]?.intensity > 0) currentStreak++;
        else currentStreak = 1;
      } else {
        currentStreak = 0;
      }
    }
    // Longest streak — walk forward
    for (const cell of heatmap) {
      if (cell.intensity > 0) {
        runningStreak++;
        longestStreak = Math.max(longestStreak, runningStreak);
      } else {
        runningStreak = 0;
      }
    }

    const totalStudyMinutes = Math.round(
      learningSessions.reduce((s, sess) => s + sess.durationSec, 0) / 60
    );
    const avgSessionMinutes = learningSessions.length > 0
      ? Math.round(totalStudyMinutes / learningSessions.length)
      : 0;
    const lessonsCompleted = progressRecords.filter(p => p.completed).length;

    return NextResponse.json({
      totalXp: xp,
      level,
      currentStreakDays: Math.max(currentStreak, userData?.streakDays || 0),
      longestStreakDays: Math.max(longestStreak, userData?.streakDays || 0),
      totalSessions: learningSessions.length,
      totalStudyMinutes,
      lessonsCompleted,
      assessmentsAnswered: assessmentAttempts.length,
      avgSessionMinutes,
      heatmap,
      xpTimeline,
      masteryDistribution,
      retentionBuckets,
      recentTransitions,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Analytics unavailable.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Read JSON helper for safety (used for any audit details that might come back)
void readJson;
