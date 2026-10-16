/**
 * Database seed script — migrates all hardcoded curriculum content into PostgreSQL.
 *
 * Run: bun run db:seed
 *
 * This seeds:
 * - 9 skills (SKILLS_TAXONOMY)
 * - 19 foundation lessons (foundationLessons)
 * - 10 diagnostic questions (DIAGNOSTIC_QUESTIONS) — stored as a single JSON blob in a settings table
 * - 24 achievements (ACHIEVEMENT_CATALOG) — already seeded by the achievements engine, but we run it here too
 *
 * After seeding, the app reads ALL curriculum content from the database.
 * Admins can edit lessons through the Knowledge Studio without code changes.
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import {
  SKILLS_TAXONOMY,
  foundationLessons,
  DIAGNOSTIC_QUESTIONS,
} from "../src/lib/curriculum";
import { ACHIEVEMENT_CATALOG } from "../src/lib/achievements";

const db = new PrismaClient();

function writeJson(value: unknown): string {
  return JSON.stringify(value ?? []);
}

async function seedSkills() {
  console.log("\n📚 Seeding skills taxonomy...");
  let count = 0;
  for (const skill of SKILLS_TAXONOMY) {
    await db.skill.upsert({
      where: { code: skill.code },
      update: {
        name: skill.name,
        description: skill.description,
        category: skill.category,
        prerequisiteSkillIds: writeJson(skill.prerequisites),
      },
      create: {
        id: skill.id,
        code: skill.code,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        prerequisiteSkillIds: writeJson(skill.prerequisites),
      },
    });
    count++;
  }
  console.log(`   ✓ ${count} skills seeded`);
}

async function seedLessons() {
  console.log("\n📖 Seeding foundation lessons...");
  let count = 0;
  for (const lesson of foundationLessons) {
    const slug = lesson.slug || lesson.id;
    await db.lesson.upsert({
      where: { id: lesson.id },
      update: {
        slug,
        title: lesson.title,
        description: lesson.description,
        pathId: lesson.pathId,
        category: lesson.category,
        level: lesson.level,
        duration: lesson.duration,
        sortOrder: lesson.order,
        content: lesson.content,
        takeaway: lesson.takeaway,
        question: lesson.question,
        options: writeJson(lesson.options),
        answer: lesson.answer,
        explanation: lesson.explanation,
        questionsList: lesson.questionsList ? writeJson(lesson.questionsList) : null,
        prerequisiteId: lesson.prerequisiteId,
        skillIds: writeJson(lesson.skillIds),
        status: lesson.status,
        version: lesson.version,
      },
      create: {
        id: lesson.id,
        slug,
        title: lesson.title,
        description: lesson.description,
        pathId: lesson.pathId,
        category: lesson.category,
        level: lesson.level,
        duration: lesson.duration,
        sortOrder: lesson.order,
        content: lesson.content,
        takeaway: lesson.takeaway,
        question: lesson.question,
        options: writeJson(lesson.options),
        answer: lesson.answer,
        explanation: lesson.explanation,
        questionsList: lesson.questionsList ? writeJson(lesson.questionsList) : null,
        prerequisiteId: lesson.prerequisiteId,
        skillIds: writeJson(lesson.skillIds),
        status: lesson.status,
        version: lesson.version,
      },
    });
    count++;
  }
  console.log(`   ✓ ${count} lessons seeded`);
}

async function seedDiagnosticQuestions() {
  console.log("\n🎯 Seeding diagnostic questions...");
  // Store diagnostic questions in the AuditEvent table as a special "settings" entry
  // (avoids creating a new model just for this)
  const settingsId = "atlas-diagnostic-questions";
  await db.auditEvent.upsert({
    where: { id: settingsId },
    update: {
      actorId: "system",
      action: "diagnostic_questions.updated",
      subjectId: "diagnostic",
      details: writeJson(DIAGNOSTIC_QUESTIONS),
    },
    create: {
      id: settingsId,
      actorId: "system",
      action: "diagnostic_questions.seeded",
      subjectId: "diagnostic",
      details: writeJson(DIAGNOSTIC_QUESTIONS),
    },
  });
  console.log(`   ✓ ${DIAGNOSTIC_QUESTIONS.length} diagnostic questions seeded`);
}

async function seedAchievements() {
  console.log("\n🏆 Seeding achievements...");
  let count = 0;
  for (const def of ACHIEVEMENT_CATALOG) {
    await db.achievement.upsert({
      where: { code: def.code },
      update: {
        name: def.name,
        description: def.description,
        category: def.category,
        iconKey: def.iconKey,
        tier: def.tier,
        xpReward: def.xpReward,
        criteria: writeJson(def.criteria),
      },
      create: {
        id: def.id,
        code: def.code,
        name: def.name,
        description: def.description,
        category: def.category,
        iconKey: def.iconKey,
        tier: def.tier,
        xpReward: def.xpReward,
        criteria: writeJson(def.criteria),
      },
    });
    count++;
  }
  console.log(`   ✓ ${count} achievements seeded`);
}

async function main() {
  console.log("========================================");
  console.log("  Atlas Academy — Database Seed");
  console.log("========================================");

  await seedSkills();
  await seedLessons();
  await seedDiagnosticQuestions();
  await seedAchievements();

  console.log("\n========================================");
  console.log("  ✅ Seed complete!");
  console.log("========================================");
  console.log("\nThe database now contains:");
  console.log("  - All 9 skills (editable via Knowledge Studio)");
  console.log("  - All 19 foundation lessons (editable via Knowledge Studio)");
  console.log("  - All 10 diagnostic questions");
  console.log("  - All 24 achievements");
  console.log("\nAdmins can now create, edit, and publish lessons through");
  console.log("the Knowledge Studio WITHOUT code changes or redeployment.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
