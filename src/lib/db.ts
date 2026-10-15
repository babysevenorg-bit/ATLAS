import { PrismaClient } from '@prisma/client'

// Global cache so we don't spin up a new Prisma client on every serverless invocation.
// Vercel serverless functions reuse the same Node module instance across warm starts.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// IMPORTANT: Do NOT pass `datasources` to the PrismaClient constructor.
// Prisma reads DATABASE_URL from the environment at runtime automatically.
// Passing `datasources: { db: { url: process.env.DATABASE_URL } }` explicitly
// breaks the Vercel BUILD phase (when env vars aren't yet available) with:
//   "Invalid value undefined for datasource 'db' provided to PrismaClient constructor"
// At runtime, Vercel injects the env vars, and Prisma picks them up.
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })
}

export const db = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
