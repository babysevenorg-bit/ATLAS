import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action || "");
    if (action === "logout") {
      await destroySession();
      return NextResponse.json({ ok: true });
    }
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return NextResponse.json({ error: "Enter a valid email and a password of at least 8 characters." }, { status: 400 });
    }
    if (action === "register") {
      const name = String(body.name || "").trim().slice(0, 80);
      if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing.length) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
      const role = count === 0 ? "owner" : "learner";
      const user = { id: randomUUID(), name, email, passwordHash: hashPassword(password), role };
      await db.insert(users).values(user);
      await createSession(user.id);
      return NextResponse.json({ ok: true, role });
    }
    if (action === "login") {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
      await createSession(user.id);
      return NextResponse.json({ ok: true, role: user.role });
    }
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unable to complete the request. Please try again." }, { status: 500 });
  }
}
