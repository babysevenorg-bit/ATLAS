import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { assessmentAttempts, progress, learnerSkillMastery, revisionQueue, users } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { getPublishedLessons, getUserProgress } from "@/lib/learning";
import { and, eq, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Sign in to save assessment results." }, { status: 401 });
    const body = await request.json();
    const lessonId = String(body.lessonId || "");
    const answer = body.answer;
    
    const lessonsList = await getPublishedLessons();
    const lesson = lessonsList.find(item => item.id === lessonId);
    if (!lesson || !Number.isInteger(answer) || answer < 0 || answer >= lesson.options.length) {
      return NextResponse.json({ error: "Invalid assessment submission." }, { status: 400 });
    }

    const allProgress = await getUserProgress(user.id);
    if (lesson.prerequisiteId && !allProgress.some(item => item.lessonId === lesson.prerequisiteId && item.completed)) {
      return NextResponse.json({ error: "Complete the prerequisite lesson first." }, { status: 403 });
    }

    const correct = answer === lesson.answer;
    const current = allProgress.find(item => item.lessonId === lessonId);

    await db.transaction(async tx => {
      // 1. Record immutable attempt
      await tx.insert(assessmentAttempts).values({
        id: randomUUID(),
        userId: user.id,
        lessonId,
        answer,
        correct,
        scorePercent: correct ? 100 : 0,
      });

      // 2. Update lesson progress
      if (current) {
        await tx.update(progress).set({
          completed: current.completed || correct,
          score: correct ? 100 : current.score,
          attempts: current.attempts + 1,
          updatedAt: new Date(),
        }).where(and(eq(progress.userId, user.id), eq(progress.lessonId, lessonId)));
      } else {
        await tx.insert(progress).values({
          id: randomUUID(),
          userId: user.id,
          lessonId,
          completed: correct,
          score: correct ? 100 : 0,
          attempts: 1,
        });
      }

      // 3. Update skill mastery states
      if (lesson.skillIds && lesson.skillIds.length > 0) {
        for (const skillId of lesson.skillIds) {
          const targetState = correct ? "demonstrated" : "developing";
          const [existingMastery] = await tx.select().from(learnerSkillMastery)
            .where(and(eq(learnerSkillMastery.userId, user.id), eq(learnerSkillMastery.skillId, skillId)))
            .limit(1);

          if (existingMastery) {
            await tx.update(learnerSkillMastery).set({
              state: correct ? "demonstrated" : existingMastery.state === "demonstrated" ? "demonstrated" : "developing",
              evidenceScore: correct ? Math.min(100, existingMastery.evidenceScore + 25) : existingMastery.evidenceScore,
              lastAssessedAt: new Date(),
            }).where(eq(learnerSkillMastery.id, existingMastery.id));
          } else {
            await tx.insert(learnerSkillMastery).values({
              id: randomUUID(),
              userId: user.id,
              skillId,
              state: targetState,
              evidenceScore: correct ? 80 : 40,
              lastAssessedAt: new Date(),
            });
          }
        }
      }

      // 4. If correct, schedule in Spaced Repetition Queue (due in 2 days)
      if (correct) {
        const [existingRev] = await tx.select().from(revisionQueue)
          .where(and(eq(revisionQueue.userId, user.id), eq(revisionQueue.lessonId, lessonId)))
          .limit(1);

        const skillId = lesson.skillIds[0] || "SK-FX-01";
        const dueAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days later

        if (!existingRev) {
          await tx.insert(revisionQueue).values({
            id: randomUUID(),
            userId: user.id,
            lessonId,
            skillId,
            intervalDays: 2,
            dueAt,
          });
        }

        // Award XP and active update
        await tx.update(users).set({
          experiencePoints: sql`${users.experiencePoints} + 50`,
          lastActiveAt: new Date(),
        }).where(eq(users.id, user.id));
      }
    });

    return NextResponse.json({
      correct,
      explanation: lesson.explanation,
      completed: current?.completed || correct,
      xpGained: correct ? 50 : 0,
    });
  } catch {
    return NextResponse.json({ error: "Unable to save your answer." }, { status: 500 });
  }
}
