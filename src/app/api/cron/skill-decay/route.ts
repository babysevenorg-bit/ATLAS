import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";

export const dynamic = "force-dynamic";

// POST /api/cron/skill-decay
// Downgrades demonstrated skills that haven't been assessed in 30+ days to "needs_revision".
// In production this would be a daily cron; here it's an on-demand endpoint
// the dashboard can call when the user loads the analytics page.
export async function POST() {
  try {
    const decayThresholdDays = 30;
    const cutoff = new Date(Date.now() - decayThresholdDays * 24 * 60 * 60 * 1000);

    // Find demonstrated skills with stale lastAssessedAt
    const staleSkills = await db.learnerSkillMastery.findMany({
      where: {
        state: "demonstrated",
        lastAssessedAt: { lt: cutoff },
      },
    });

    let downgraded = 0;
    for (const skill of staleSkills) {
      await db.$transaction(async (tx) => {
        // Downgrade the skill
        await tx.learnerSkillMastery.update({
          where: { id: skill.id },
          data: {
            state: "needs_revision",
            evidenceScore: Math.max(0, skill.evidenceScore - 10),
          },
        });

        // Record the state transition in history
        await tx.skillStateHistory.create({
          data: {
            id: randomUUID(),
            userId: skill.userId,
            skillId: skill.skillId,
            previousState: "demonstrated",
            newState: "needs_revision",
            evidenceScoreDelta: -10,
            triggerActivity: "decay",
            triggerLessonId: null,
          },
        });
      }).catch(() => {});
      downgraded++;
    }

    // Also count revision queue items that are now overdue
    const overdueRevision = await db.revisionQueue.findMany({
      where: { dueAt: { lt: new Date() } },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      decayThresholdDays,
      skillsDowngraded: downgraded,
      overdueRevisionCards: overdueRevision.length,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Skill decay pass failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
