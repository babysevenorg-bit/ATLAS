// Lightweight schema module that preserves the `import { users, lessons, ... } from "@/db/schema"`
// pattern used throughout the codebase. Each export is a thin object describing the
// Prisma model name plus helpers for JSON-encoded fields (SQLite does not have a
// native JSON type, so we round-trip via JSON.stringify/JSON.parse).
//
// Migration strategy:
//   - Drizzle `db.select().from(table).where(eq(table.col, value))` has been
//     migrated per-file to direct Prisma client calls (`db.user.findMany(...)`).
//   - These exports remain so the legacy import sites keep working as we touch
//     each file. They carry no runtime behaviour beyond a `name` field used by
//     helper utilities.
export type JsonField<T> = { value: T | null; read: () => T | null; write: (v: T) => string };

export const users = { name: "user" as const };
export const sessions = { name: "session" as const };
export const lessons = { name: "lesson" as const };
export const skills = { name: "skill" as const };
export const learnerSkillMastery = { name: "learnerSkillMastery" as const };
export const progress = { name: "progress" as const };
export const assessmentAttempts = { name: "assessmentAttempt" as const };
export const diagnosticAttempts = { name: "diagnosticAttempt" as const };
export const revisionQueue = { name: "revisionQueue" as const };
export const simOrders = { name: "simOrder" as const };
export const binarySims = { name: "binarySim" as const };
export const auditEvents = { name: "auditEvent" as const };

// JSON helpers — used to round-trip array/object columns stored as TEXT in SQLite.
export function readJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(value: unknown): string {
  return JSON.stringify(value ?? []);
}
