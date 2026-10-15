import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { getUser } from "@/lib/auth";
import { getPublishedLessons, getUserProgress } from "@/lib/learning";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json(
        { error: "Sign in to save assessment results." },
        { status: 401 }
      );

    const body = await request.json();
    const lessonId = String(body.lessonId || "");
    const answer = body.answer;

    const lessonsList = await getPublishedLessons();
    const lesson = lessonsList.find((item) => item.id === lessonId);
    if (
      !lesson ||
      !Number.isInteger(answer) ||
      answer < 0 ||
      answer >= lesson.options.length
    ) {
      return NextResponse.json(
        { error: "Invalid assessment submission." },
        { status: 400 }
      );
    }

    const allProgress = await getUserProgress(user.id);
    if (
      lesson.prerequisiteId &&
      !allProgress.some(
        (item) => item.lessonId === lesson.prerequisiteId && item.completed
      )
    ) {
      return NextResponse.json(
        { error: "Complete the prerequisite lesson first." },
        { status: 403 }
      );
    }

    const correct = answer === lesson.answer;
    const current = allProgress.find((item) => item.lessonId === lessonId);

    await db.$transaction(async (tx) => {
      // 1. Record immutable attempt
      await tx.assessmentAttempt.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          lessonId,
          answer,
          correct,
          scorePercent: correct ? 100 : 0,
        },
      });

      // 2. Update lesson progress
      if (current) {
        await tx.progress.update({
          where: { userId_lessonId: { userId: user.id, lessonId } },
          data: {
            completed: current.completed || correct,
            score: correct ? 100 : current.score,
            attempts: current.attempts + 1,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.progress.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            lessonId,
            completed: correct,
            score: correct ? 100 : 0,
            attempts: 1,
          },
        });
      }

      // 3. Update skill mastery states + record state transitions (history)
      if (lesson.skillIds && lesson.skillIds.length > 0) {
        for (const skillId of lesson.skillIds) {
          const existingMastery = await tx.learnerSkillMastery.findUnique({
            where: { userId_skillId: { userId: user.id, skillId } },
          });

          const newState = correct
            ? "demonstrated"
            : existingMastery?.state === "demonstrated"
              ? "demonstrated"
              : "developing";
          const prevEvidence = existingMastery?.evidenceScore ?? 0;
          const newEvidence = correct
            ? Math.min(100, prevEvidence + 25)
            : prevEvidence;
          const prevState = existingMastery?.state ?? "not_started";

          if (existingMastery) {
            await tx.learnerSkillMastery.update({
              where: { id: existingMastery.id },
              data: {
                state: newState,
                evidenceScore: newEvidence,
                lastAssessedAt: new Date(),
              },
            });
          } else {
            await tx.learnerSkillMastery.create({
              data: {
                id: randomUUID(),
                userId: user.id,
                skillId,
                state: newState,
                evidenceScore: correct ? 80 : 40,
                lastAssessedAt: new Date(),
              },
            });
          }

          // Append a SkillStateHistory row whenever state changes
          if (newState !== prevState || newEvidence !== prevEvidence) {
            await tx.skillStateHistory.create({
              data: {
                id: randomUUID(),
                userId: user.id,
                skillId,
                previousState: prevState,
                newState,
                evidenceScoreDelta: newEvidence - prevEvidence,
                triggerLessonId: lessonId,
                triggerActivity: "assessment",
              },
            });
          }
        }
      }

      // 4. If correct, schedule in Spaced Repetition Queue (due in 2 days)
      if (correct) {
        const existingRev = await tx.revisionQueue.findUnique({
          where: { userId_lessonId: { userId: user.id, lessonId } },
        });

        const skillId = lesson.skillIds[0] || "SK-FX-01";
        const dueAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days later

        if (!existingRev) {
          await tx.revisionQueue.create({
            data: {
              id: randomUUID(),
              userId: user.id,
              lessonId,
              skillId,
              intervalDays: 2,
              dueAt,
            },
          });
        }

        // Award XP and update last active timestamp
        await tx.user.update({
          where: { id: user.id },
          data: {
            experiencePoints: { increment: 50 },
            lastActiveAt: new Date(),
          },
        });
      }

      // 5. Record a LearningSession entry (analytics + heatmap source-of-truth)
      // Look for an active session in the last 30 minutes; extend it, else create new.
      const recentSessionCutoff = new Date(Date.now() - 30 * 60 * 1000);
      const recentSession = await tx.learningSession.findFirst({
        where: {
          userId: user.id,
          startedAt: { gte: recentSessionCutoff },
          endedAt: null,
        },
        orderBy: { startedAt: "desc" },
      });
      if (recentSession) {
        await tx.learningSession.update({
          where: { id: recentSession.id },
          data: {
            assessmentsAnswered: recentSession.assessmentsAnswered + 1,
            xpEarned: recentSession.xpEarned + (correct ? 50 : 0),
            lessonsCompleted:
              recentSession.lessonsCompleted + (correct && !current?.completed ? 1 : 0),
            endedAt: new Date(),
            durationSec:
              recentSession.durationSec +
              Math.floor((Date.now() - recentSession.startedAt.getTime()) / 1000),
          },
        });
      } else {
        await tx.learningSession.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            startedAt: new Date(),
            endedAt: new Date(),
            durationSec: 60,
            lessonsCompleted: correct && !current?.completed ? 1 : 0,
            assessmentsAnswered: 1,
            xpEarned: correct ? 50 : 0,
            activityType: "study",
          },
        });
      }
    });

    return NextResponse.json({
      correct,
      explanation: lesson.explanation,
      completed: current?.completed || correct,
      xpGained: correct ? 50 : 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to save your answer." },
      { status: 500 }
    );
  }
}
