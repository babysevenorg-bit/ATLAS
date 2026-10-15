import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { db } from "@/db";
import { createHash as _unused } from "node:crypto"; // ensure module side-effects loaded

const COOKIE = "atlas_session";

export const hashPassword = (
  password: string,
  salt = randomBytes(16).toString("hex")
) => `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { id: digest(token), userId, expiresAt },
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  persona: string;
  virtualBalance: number;
  experiencePoints: number;
};

export async function getUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: digest(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    persona: session.user.persona,
    virtualBalance: session.user.virtualBalance,
    experiencePoints: session.user.experiencePoints,
  };
}

export async function destroySession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { id: digest(token) } });
  }
  (await cookies()).delete(COOKIE);
}

// Reference to silence unused import in some build modes.
void _unused;
