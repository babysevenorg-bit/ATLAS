import { NextRequest, NextResponse } from "next/server";
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

// PATCH /api/journal/item — update an existing entry.
// Body: { id, title?, body?, tags?, emotions?, moodRating?, simOrderId?, screenshotUrl? }
// Pass simOrderId: null to unlink the entry from its trade.
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to update journal entries." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "Entry id is required." }, { status: 400 });
    }

    const existing = await db.journalEntry.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Entry not found or access denied." },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};

    if (typeof body.title === "string") {
      const title = body.title.trim().slice(0, 140);
      if (!title) {
        return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
      }
      data.title = title;
    }
    if (typeof body.body === "string") {
      data.body = body.body.slice(0, 12000);
    }
    if (Array.isArray(body.tags)) {
      data.tags = writeJson(
        Array.from(new Set(body.tags.map((t: unknown) => String(t).trim()).filter(Boolean))).slice(0, 12)
      );
    }
    if (Array.isArray(body.emotions)) {
      data.emotions = writeJson(
        Array.from(
          new Set(
            body.emotions
              .map((e: unknown) => String(e).toLowerCase())
              .filter((e: string) => ALLOWED_EMOTIONS.has(e))
          )
        ).slice(0, 8)
      );
    }
    if (body.moodRating !== undefined) {
      data.moodRating = Math.max(1, Math.min(5, Math.round(Number(body.moodRating) || 3)));
    }
    if (body.screenshotUrl !== undefined) {
      data.screenshotUrl = body.screenshotUrl
        ? String(body.screenshotUrl).slice(0, 600)
        : null;
    }
    if (body.simOrderId !== undefined) {
      if (body.simOrderId === null) {
        data.simOrderId = null;
      } else {
        const candidate = String(body.simOrderId);
        const owned = await db.simOrder.findUnique({
          where: { id: candidate },
          select: { userId: true },
        });
        if (owned && owned.userId === user.id) {
          data.simOrderId = candidate;
        }
      }
    }

    const updated = await db.journalEntry.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ok: true,
      entry: {
        id: updated.id,
        simOrderId: updated.simOrderId,
        title: updated.title,
        body: updated.body,
        tags: safeParseArray(updated.tags),
        emotions: safeParseArray(updated.emotions),
        screenshotUrl: updated.screenshotUrl,
        moodRating: updated.moodRating,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to update entry.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/journal/item — permanently remove an entry.
// Body: { id }
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to delete journal entries." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "Entry id is required." }, { status: 400 });
    }

    const existing = await db.journalEntry.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Entry not found or access denied." },
        { status: 404 }
      );
    }

    await db.journalEntry.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to delete entry.";
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
