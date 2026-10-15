import { PrismaClient } from '@prisma/client'

// Global cache so we don't spin up a new Prisma client on every serverless invocation.
// Vercel serverless functions reuse the same Node module instance across warm starts.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Vercel Postgres (and most serverless PG providers) use PgBouncer-style pooling.
// We need to limit the connection pool and use a short timeout so cold starts don't hang.
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
