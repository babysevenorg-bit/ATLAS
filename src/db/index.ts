// Database adapter for Atlas Academy.
// Re-exports the Prisma client so legacy imports like `import { db } from "@/db"`
// continue to work. The Drizzle-orm-style schema exports in `./schema` are
// preserved as lightweight proxies so existing call sites that use the
// `db.select().from(table)` pattern can be migrated incrementally.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  __atlasPrisma?: PrismaClient;
};

export const db =
  globalForPrisma.__atlasPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__atlasPrisma = db;
}
