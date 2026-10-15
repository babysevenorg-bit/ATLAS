// Database adapter for Atlas Academy.
// Re-exports the Prisma client so legacy imports like `import { db } from "@/db"`
// continue to work. Uses the same singleton pattern as src/lib/db.ts.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  __atlasPrisma?: PrismaClient;
};

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export const db =
  globalForPrisma.__atlasPrisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__atlasPrisma = db;
}
