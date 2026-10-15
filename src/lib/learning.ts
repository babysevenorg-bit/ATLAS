import { db } from "@/db";
import { readJson } from "@/db/schema";
import { foundationLessons, type Lesson } from "@/lib/curriculum";

type DbLesson = {
  id: string;
  slug: string;
  title: string;
  description: string;
  pathId: string;
  category: string;
  level: string;
  duration: number;
  sortOrder: number;
  content: string;
  takeaway: string;
  question: string;
  options: string;
  answer: number;
  explanation: string;
  questionsList: string | null;
  prerequisiteId: string | null;
  skillIds: string | null;
  status: string;
  version: number;
};

function mapLesson(item: DbLesson): Lesson {
  return {
    id: item.id,
    slug: item.slug || item.id,
    title: item.title,
    description: item.description,
    pathId: (item.pathId as Lesson["pathId"]) || "forex-foundations",
    category: item.category,
    level: (item.level as Lesson["level"]) || "Beginner",
    duration: item.duration,
    order: item.sortOrder,
    content: item.content,
    takeaway: item.takeaway,
    question: item.question,
    options: readJson<string[]>(item.options, []),
    answer: item.answer,
    explanation: item.explanation,
    questionsList: readJson(item.questionsList, undefined as never) || undefined,
    prerequisiteId: item.prerequisiteId,
    skillIds: readJson<string[]>(item.skillIds, []),
    status: (item.status as Lesson["status"]) || "published",
    version: item.version,
  };
}

export async function getPublishedLessons(): Promise<Lesson[]> {
  try {
    const additions = await db.lesson.findMany({
      where: { status: "published" },
    });
    const mapped = additions.map((item) =>
      mapLesson({
        ...item,
        sortOrder: item.sortOrder,
      } as DbLesson)
    );
    return [...foundationLessons, ...mapped].sort((a, b) => a.order - b.order);
  } catch {
    return foundationLessons;
  }
}

export async function getUserProgress(userId: string) {
  try {
    const rows = await db.progress.findMany({ where: { userId } });
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      lessonId: row.lessonId,
      completed: row.completed,
      score: row.score,
      attempts: row.attempts,
      timeSpentSec: row.timeSpentSec,
      updatedAt: row.updatedAt,
    }));
  } catch {
    return [];
  }
}

export async function getUserSkillMastery(userId: string) {
  try {
    return await db.learnerSkillMastery.findMany({ where: { userId } });
  } catch {
    return [];
  }
}

export async function getUserDiagnostic(userId: string) {
  try {
    const latest = await db.diagnosticAttempt.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return latest || null;
  } catch {
    return null;
  }
}

export async function getUserSimOrders(userId: string) {
  try {
    return await db.simOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getUserBinarySims(userId: string) {
  try {
    return await db.binarySim.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}
