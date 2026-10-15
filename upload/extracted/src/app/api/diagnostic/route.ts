import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { diagnosticAttempts, learnerSkillMastery, progress, users } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { DIAGNOSTIC_QUESTIONS, foundationLessons } from "@/lib/curriculum";
import { and, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const body = await request.json();
    const answers: number[] = body.answers;

    if (!Array.isArray(answers) || answers.length !== DIAGNOSTIC_QUESTIONS.length) {
      return NextResponse.json({ error: "Please answer all diagnostic questions." }, { status: 400 });
    }

    let score = 0;
    const categoryScores: Record<string, { correct: number; total: number }> = {};

    DIAGNOSTIC_QUESTIONS.forEach((q, index) => {
      const userAns = answers[index];
      const isCorrect = userAns === q.answer;
      if (isCorrect) score += 1;

      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { correct: 0, total: 0 };
      }
      categoryScores[q.category].total += 1;
      if (isCorrect) categoryScores[q.category].correct += 1;
    });

    const percent = Math.round((score / DIAGNOSTIC_QUESTIONS.length) * 100);
    let assignedLevel: "Beginner" | "Developing" | "Advanced" = "Beginner";
    if (percent >= 80) assignedLevel = "Advanced";
    else if (percent >= 50) assignedLevel = "Developing";

    const categoryPercents: Record<string, number> = {};
    for (const [cat, data] of Object.entries(categoryScores)) {
      categoryPercents[cat] = Math.round((data.correct / data.total) * 100);
    }

    if (user) {
      await db.transaction(async tx => {
        // Record diagnostic attempt
        await tx.insert(diagnosticAttempts).values({
          id: randomUUID(),
          userId: user.id,
          score,
          totalQuestions: DIAGNOSTIC_QUESTIONS.length,
          assignedLevel,
          categoryScores: categoryPercents,
          answers,
        });

        // Update user persona
        await tx.update(users).set({
          persona: assignedLevel.toLowerCase(),
          lastActiveAt: new Date(),
        }).where(eq(users.id, user.id));

        // If advanced or developing, credit demonstrated mastery for foundational lessons
        if (assignedLevel === "Advanced" || (assignedLevel === "Developing" && categoryPercents["Foundations"] === 100)) {
          const autoUnlockIds = ["what-is-forex", "currency-pairs", "pips-spreads"];
          for (const lId of autoUnlockIds) {
            const [cur] = await tx.select().from(progress).where(and(eq(progress.userId, user.id), eq(progress.lessonId, lId))).limit(1);
            if (!cur) {
              await tx.insert(progress).values({
                id: randomUUID(),
                userId: user.id,
                lessonId: lId,
                completed: true,
                score: 100,
                attempts: 1,
              });
            }
          }

          // Update skill mastery
          const baseSkills = ["SK-FX-01", "SK-FX-02"];
          for (const sId of baseSkills) {
            const [curM] = await tx.select().from(learnerSkillMastery).where(and(eq(learnerSkillMastery.userId, user.id), eq(learnerSkillMastery.skillId, sId))).limit(1);
            if (!curM) {
              await tx.insert(learnerSkillMastery).values({
                id: randomUUID(),
                userId: user.id,
                skillId: sId,
                state: "demonstrated",
                evidenceScore: 90,
              });
            }
          }
        }
      });
    }

    return NextResponse.json({
      score,
      total: DIAGNOSTIC_QUESTIONS.length,
      percent,
      assignedLevel,
      categoryScores: categoryPercents,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to evaluate diagnostic assessment." }, { status: 500 });
  }
}
