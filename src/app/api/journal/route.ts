import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { getUser } from "@/lib/auth";
import { writeJson } from "@/db/schema";

export const dynamic = "force-dynamic";

const ALLOWED_EMOTIONS = new Set([
  "calm",
  "confident",
  "patient",
  "disciplined",
  "anxious",
  "frustrated",
  "greedy",
  "fomo",
  "regretful",
  "hopeful",
]);

// GET /api/journal — list the authenticated user's journal entries,
// optionally linked to recent SimOrder rows so the client can render a
// "linked trade" pill. Newest first.
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ entries: [], simOrders: [] });
    }

    const [entries, simOrders] = await Promise.all([
      db.journalEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 250,
      }),
      db.simOrder.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          symbol: true,
          type: true,
          status: true,
          pnl: true,
          lots: true,
          openPrice: true,
          closePrice: true,
          openTime: true,
          closeTime: true,
        },
      }),
    ]);

    return NextResponse.json({
      entries: entries.map(e => ({
        id: e.id,
        simOrderId: e.simOrderId,
        title: e.title,
        body: e.body,
        tags: safeParseArray(e.tags),
        emotions: safeParseArray(e.emotions),
        screenshotUrl: e.screenshotUrl,
        moodRating: e.moodRating,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
      simOrders: simOrders.map(o => ({
        id: o.id,
        symbol: o.symbol,
        type: o.type,
        status: o.status,
        pnl: o.pnl,
        lots: o.lots,
        openPrice: o.openPrice,
        closePrice: o.closePrice,
        openTime: o.openTime.toISOString(),
        closeTime: o.closeTime?.toISOString() ?? null,
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Journal unavailable.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/journal — create a new entry for the authenticated user.
// Body: { title, body, tags[], emotions[], moodRating, simOrderId?, screenshotUrl? }
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to save journal entries." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || "").trim().slice(0, 140);
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const entryBody = String(body.body || "").slice(0, 12000);
    const tags = Array.isArray(body.tags)
      ? Array.from(new Set(body.tags.map((t: unknown) => String(t).trim()).filter(Boolean))).slice(0, 12)
      : [];
    const emotions = Array.isArray(body.emotions)
      ? Array.from(
          new Set(
            body.emotions
              .map((e: unknown) => String(e).toLowerCase())
              .filter((e: string) => ALLOWED_EMOTIONS.has(e))
          )
        ).slice(0, 8)
      : [];
    const moodRating = Math.max(1, Math.min(5, Math.round(Number(body.moodRating) || 3)));
    const screenshotUrl = body.screenshotUrl
      ? String(body.screenshotUrl).slice(0, 600)
      : null;

    // Optional link to a SimOrder — must belong to the same user.
    let simOrderId: string | null = null;
    if (body.simOrderId) {
      const candidate = String(body.simOrderId);
      const owned = await db.simOrder.findUnique({
        where: { id: candidate },
        select: { userId: true },
      });
      if (owned && owned.userId === user.id) {
        simOrderId = candidate;
      }
    }

    const id = randomUUID();
    const created = await db.journalEntry.create({
      data: {
        id,
        userId: user.id,
        simOrderId,
        title,
        body: entryBody,
        tags: writeJson(tags),
        emotions: writeJson(emotions),
        moodRating,
        screenshotUrl,
      },
    });

    // Record a learning session entry so the analytics heatmap picks this up.
    await db.learningSession
      .create({
        data: {
          id: randomUUID(),
          userId: user.id,
          startedAt: new Date(),
          endedAt: new Date(),
          durationSec: 90,
          xpEarned: 10,
          activityType: "study",
        },
      })
      .catch(() => {});

    // Award a small XP stipend for reflective journaling.
    await db.user
      .update({
        where: { id: user.id },
        data: { experiencePoints: { increment: 10 }, lastActiveAt: new Date() },
      })
      .catch(() => {});

    return NextResponse.json({
      ok: true,
      entry: {
        id: created.id,
        simOrderId: created.simOrderId,
        title: created.title,
        body: created.body,
        tags: safeParseArray(created.tags),
        emotions: safeParseArray(created.emotions),
        screenshotUrl: created.screenshotUrl,
        moodRating: created.moodRating,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to save journal entry.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(v => String(v)) : [];
  } catch {
    return [];
  }
}
