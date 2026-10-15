import { pgTable, text, timestamp, integer, boolean, jsonb, doublePrecision, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("learner"), // 'learner' | 'editor' | 'administrator' | 'owner'
  persona: text("persona").notNull().default("beginner"), // 'beginner' | 'developing' | 'advanced'
  virtualBalance: doublePrecision("virtual_balance").notNull().default(10000.0),
  experiencePoints: integer("experience_points").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(1),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().default(""),
  title: text("title").notNull(),
  description: text("description").notNull(),
  pathId: text("path_id").notNull().default("forex-foundations"), // 'forex-foundations' | 'risk-management' | 'technical-analysis' | 'trading-psychology' | 'binary-options'
  category: text("category").notNull().default("Forex foundations"),
  level: text("level").notNull().default("Beginner"), // 'Beginner' | 'Developing' | 'Advanced'
  duration: integer("duration").notNull().default(8),
  order: integer("sort_order").notNull().default(100),
  content: text("content").notNull(),
  takeaway: text("takeaway").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  answer: integer("answer").notNull(),
  explanation: text("explanation").notNull(),
  questionsList: jsonb("questions_list").$type<{
    id: string;
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  }[]>(),
  prerequisiteId: text("prerequisite_id"),
  skillIds: jsonb("skill_ids").$type<string[]>().default([]),
  status: text("status").notNull().default("draft"), // 'draft' | 'published' | 'archived'
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  prerequisiteSkillIds: jsonb("prerequisite_skill_ids").$type<string[]>().default([]),
});

export const learnerSkillMastery = pgTable("learner_skill_mastery", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skillId: text("skill_id").notNull(),
  state: text("state").notNull().default("not_started"), // 'not_started' | 'learning' | 'developing' | 'practising' | 'demonstrated' | 'needs_revision'
  evidenceScore: integer("evidence_score").notNull().default(0),
  lastAssessedAt: timestamp("last_assessed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("skill_mastery_user_skill_unique").on(table.userId, table.skillId)]);

export const progress = pgTable("progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  score: integer("score").notNull().default(0),
  attempts: integer("attempts").notNull().default(0),
  timeSpentSec: integer("time_spent_sec").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("progress_user_lesson_unique").on(table.userId, table.lessonId)]);

export const assessmentAttempts = pgTable("assessment_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull(),
  answer: integer("answer").notNull(),
  answersList: jsonb("answers_list").$type<number[]>(),
  correct: boolean("correct").notNull(),
  scorePercent: integer("score_percent").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const diagnosticAttempts = pgTable("diagnostic_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  assignedLevel: text("assigned_level").notNull(), // 'Beginner' | 'Developing' | 'Advanced'
  categoryScores: jsonb("category_scores").$type<Record<string, number>>(),
  answers: jsonb("answers").$type<number[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const revisionQueue = pgTable("revision_queue", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull(),
  skillId: text("skill_id").notNull(),
  intervalDays: integer("interval_days").notNull().default(1),
  easeFactor: doublePrecision("ease_factor").notNull().default(2.5),
  repetitions: integer("repetitions").notNull().default(0),
  dueAt: timestamp("due_at", { withTimezone: true }).defaultNow().notNull(),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
}, (table) => [uniqueIndex("revision_user_lesson_unique").on(table.userId, table.lessonId)]);

export const simOrders = pgTable("sim_orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(), // 'EUR/USD' | 'GBP/USD' | 'USD/JPY' | 'AUD/USD'
  type: text("type").notNull(), // 'BUY' | 'SELL'
  orderType: text("order_type").notNull().default("MARKET"), // 'MARKET' | 'LIMIT' | 'STOP'
  lots: doublePrecision("lots").notNull(),
  openPrice: doublePrecision("open_price").notNull(),
  closePrice: doublePrecision("close_price"),
  sl: doublePrecision("sl"),
  tp: doublePrecision("tp"),
  status: text("status").notNull().default("OPEN"), // 'OPEN' | 'CLOSED' | 'CANCELLED'
  pnl: doublePrecision("pnl").notNull().default(0),
  pips: doublePrecision("pips").notNull().default(0),
  openTime: timestamp("open_time", { withTimezone: true }).defaultNow().notNull(),
  closeTime: timestamp("close_time", { withTimezone: true }),
  closeReason: text("close_reason"), // 'MANUAL' | 'TP_HIT' | 'SL_HIT' | 'REPLAY_END'
  setupNote: text("setup_note"),
  riskPercentage: doublePrecision("risk_percentage"),
  planFollowed: boolean("plan_followed").default(true),
  processScore: integer("process_score").default(100), // Process discipline score (0-100)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const binarySims = pgTable("binary_sims", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  asset: text("asset").notNull(),
  direction: text("direction").notNull(), // 'CALL' | 'PUT'
  stake: doublePrecision("stake").notNull(),
  strikePrice: doublePrecision("strike_price").notNull(),
  expiryPrice: doublePrecision("expiry_price").notNull(),
  expirySeconds: integer("expiry_seconds").notNull(),
  payoutPercent: doublePrecision("payout_percent").notNull(), // e.g. 80.0 for 80%
  outcome: text("outcome").notNull(), // 'WIN' | 'LOSS' | 'TIE'
  returnAmount: doublePrecision("return_amount").notNull(),
  netPnl: doublePrecision("net_pnl").notNull(),
  expectedValue: doublePrecision("expected_value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  subjectId: text("subject_id").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
