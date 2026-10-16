import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { writeJson } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { getDiagnosticQuestions } from "@/lib/learning";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const body = await request.json();
    const answers: number[] = body.answers;

    // Fetch diagnostic questions from DB (falls back to hardcoded if not seeded)
    const DIAGNOSTIC_QUESTIONS = await getDiagnosticQuestions();

    if (!Array.isArray(answers) || answers.length !== DIAGNOSTIC_QUESTIONS.length) {
      return NextResponse.json(
        { error: "Please answer all diagnostic questions." },
        { status: 400 }
      );
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
      await db.$transaction(async (tx) => {
        await tx.diagnosticAttempt.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            score,
            totalQuestions: DIAGNOSTIC_QUESTIONS.length,
            assignedLevel,
            categoryScores: writeJson(categoryPercents),
            answers: writeJson(answers),
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            persona: assignedLevel.toLowerCase(),
            lastActiveAt: new Date(),
          },
        });

        if (
          assignedLevel === "Advanced" ||
          (assignedLevel === "Developing" && categoryPercents["Foundations"] === 100)
        ) {
          const autoUnlockIds = ["what-is-forex", "currency-pairs", "pips-spreads"];
          for (const lId of autoUnlockIds) {
            const cur = await tx.progress.findUnique({
              where: { userId_lessonId: { userId: user.id, lessonId: lId } },
            });
            if (!cur) {
              await tx.progress.create({
                data: {
                  id: randomUUID(),
                  userId: user.id,
                  lessonId: lId,
                  completed: true,
                  score: 100,
                  attempts: 1,
                },
              });
            }
          }

          const baseSkills = ["SK-FX-01", "SK-FX-02"];
          for (const sId of baseSkills) {
            const curM = await tx.learnerSkillMastery.findUnique({
              where: { userId_skillId: { userId: user.id, skillId: sId } },
            });
            if (!curM) {
              await tx.learnerSkillMastery.create({
                data: {
                  id: randomUUID(),
                  userId: user.id,
                  skillId: sId,
                  state: "demonstrated",
                  evidenceScore: 90,
                },
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
  } catch {
    return NextResponse.json(
      { error: "Failed to evaluate diagnostic assessment." },
      { status: 500 }
    );
  }
}
