import { db } from "@/db";
import { readJson } from "@/db/schema";
import { foundationLessons, type Lesson } from "@/lib/curriculum";

type DbLessonRow = {
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

function mapLesson(item: DbLessonRow): Lesson {
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

// Returns ALL published lessons from the database.
// If the database is empty (first deploy before seeding), falls back to hardcoded
// foundationLessons so the app still renders. Run `bun run db:seed` to populate the DB.
export async function getPublishedLessons(): Promise<Lesson[]> {
  try {
    const rows = await db.lesson.findMany({
      where: { status: "published" },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length === 0) {
      // Database not seeded yet — use hardcoded fallback
      return foundationLessons.sort((a, b) => a.order - b.order);
    }
    return rows.map((row) =>
      mapLesson({
        ...row,
        sortOrder: row.sortOrder,
      } as DbLessonRow)
    );
  } catch {
    // Database not connected — use hardcoded fallback
    return foundationLessons.sort((a, b) => a.order - b.order);
  }
}

export async function getUserProgress(userId: string) {
  try {
    return await db.progress.findMany({ where: { userId } });
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

// Fetches diagnostic questions from the database (stored in AuditEvent as a settings row).
// Falls back to the hardcoded DIAGNOSTIC_QUESTIONS if not seeded.
export async function getDiagnosticQuestions() {
  try {
    const settings = await db.auditEvent.findUnique({
      where: { id: "atlas-diagnostic-questions" },
    });
    if (settings?.details) {
      return readJson(settings.details, []);
    }
  } catch {}
  // Fallback to hardcoded import
  const { DIAGNOSTIC_QUESTIONS } = await import("@/lib/curriculum");
  return DIAGNOSTIC_QUESTIONS;
}
