// Database adapter for Atlas Academy.
// Re-exports the Prisma client so legacy imports like `import { db } from "@/db"`
// continue to work. Uses the same singleton pattern as src/lib/db.ts.
//
// IMPORTANT: Do NOT pass `datasources` to the PrismaClient constructor.
// Prisma reads DATABASE_URL from the environment at runtime automatically.
// Passing it explicitly breaks the Vercel build phase (env vars not available
// during `next build`) with a PrismaClientConstructorValidationError.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  __atlasPrisma?: PrismaClient;
};

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });
};

export const db =
  globalForPrisma.__atlasPrisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__atlasPrisma = db;
}
