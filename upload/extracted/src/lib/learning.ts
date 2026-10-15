import { db } from "@/db";
import { lessons, progress, learnerSkillMastery, diagnosticAttempts, revisionQueue, simOrders, binarySims } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { foundationLessons, type Lesson } from "@/lib/curriculum";

export async function getPublishedLessons(): Promise<Lesson[]> {
  try {
    const additions = await db.select().from(lessons).where(eq(lessons.status, "published"));
    const mapped = additions.map(item => ({
      id: item.id,
      slug: item.slug || item.id,
      title: item.title,
      description: item.description,
      pathId: (item.pathId as Lesson["pathId"]) || "forex-foundations",
      category: item.category,
      level: (item.level as Lesson["level"]) || "Beginner",
      duration: item.duration,
      order: item.order,
      content: item.content,
      takeaway: item.takeaway,
      question: item.question,
      options: item.options,
      answer: item.answer,
      explanation: item.explanation,
      questionsList: item.questionsList || undefined,
      prerequisiteId: item.prerequisiteId,
      skillIds: item.skillIds || [],
      status: (item.status as Lesson["status"]) || "published",
      version: item.version,
    }));
    return [...foundationLessons, ...mapped].sort((a, b) => a.order - b.order);
  } catch {
    return foundationLessons;
  }
}

export async function getUserProgress(userId: string) {
  try {
    return await db.select().from(progress).where(eq(progress.userId, userId));
  } catch {
    return [];
  }
}

export async function getUserSkillMastery(userId: string) {
  try {
    return await db.select().from(learnerSkillMastery).where(eq(learnerSkillMastery.userId, userId));
  } catch {
    return [];
  }
}

export async function getUserDiagnostic(userId: string) {
  try {
    const [latest] = await db.select().from(diagnosticAttempts)
      .where(eq(diagnosticAttempts.userId, userId))
      .orderBy(desc(diagnosticAttempts.createdAt))
      .limit(1);
    return latest || null;
  } catch {
    return null;
  }
}

export async function getUserSimOrders(userId: string) {
  try {
    return await db.select().from(simOrders)
      .where(eq(simOrders.userId, userId))
      .orderBy(desc(simOrders.createdAt));
  } catch {
    return [];
  }
}

export async function getUserBinarySims(userId: string) {
  try {
    return await db.select().from(binarySims)
      .where(eq(binarySims.userId, userId))
      .orderBy(desc(binarySims.createdAt));
  } catch {
    return [];
  }
}
