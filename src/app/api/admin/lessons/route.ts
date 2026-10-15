import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { writeJson } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { getPublishedLessons } from "@/lib/learning";

async function admin() {
  const user = await getUser();
  return user && ["owner", "administrator", "editor"].includes(user.role)
    ? user
    : null;
}

export async function GET() {
  const user = await admin();
  if (!user) return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  try {
    const list = await db.lesson.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await admin();
    if (!user) return NextResponse.json({ error: "Not authorised." }, { status: 403 });
    const body = await request.json();
    const title = String(body.title || "").trim().slice(0, 120);
    const description = String(body.description || "").trim().slice(0, 240);
    const pathId = String(body.pathId || "forex-foundations").slice(0, 50);
    const category = String(body.category || "Forex foundations").slice(0, 80);
    const level = String(body.level || "Beginner").slice(0, 30);
    const content = String(body.content || "").trim().slice(0, 25000);
    const takeaway = String(body.takeaway || "").trim().slice(0, 500);
    const question = String(body.question || "").trim().slice(0, 500);
    const explanation = String(body.explanation || "").trim().slice(0, 1000);
    const options = Array.isArray(body.options)
      ? body.options.map((v: unknown) => String(v).trim().slice(0, 300))
      : [];
    const answer = Number(body.answer);
    const prerequisiteId = body.prerequisiteId ? String(body.prerequisiteId) : null;
    const duration = Math.max(1, Math.min(60, Number(body.duration) || 8));

    if (
      !title ||
      !description ||
      !content ||
      !takeaway ||
      !question ||
      !explanation ||
      options.length !== 4 ||
      options.some((v: string) => !v) ||
      !Number.isInteger(answer) ||
      answer < 0 ||
      answer > 3
    ) {
      return NextResponse.json(
        {
          error:
            "Complete all lesson fields, four answer options and a valid correct answer.",
        },
        { status: 400 }
      );
    }

    if (
      prerequisiteId &&
      !(await getPublishedLessons()).some((item) => item.id === prerequisiteId)
    ) {
      return NextResponse.json(
        { error: "Select a valid published prerequisite." },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || id;

    await db.lesson.create({
      data: {
        id,
        slug,
        title,
        description,
        pathId,
        category,
        level,
        duration,
        sortOrder: 100 + Math.floor(Date.now() / 1000) % 100000,
        content,
        takeaway,
        question,
        options: writeJson(options),
        answer,
        explanation,
        prerequisiteId,
        skillIds: writeJson(body.skillIds || []),
        status: "draft",
        version: 1,
      },
    });

    await db.auditEvent.create({
      data: {
        id: randomUUID(),
        actorId: user.id,
        action: "lesson.created",
        subjectId: id,
        details: writeJson({ title, category, pathId }),
      },
    });

    return NextResponse.json({ ok: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to save lesson.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await admin();
    if (!user || user.role === "editor")
      return NextResponse.json(
        { error: "Not authorised to publish." },
        { status: 403 }
      );
    const body = await request.json();
    const id = String(body.id || "");
    const lesson = await db.lesson.findUnique({ where: { id } });
    if (!lesson)
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

    const newStatus = body.status === "published" ? "published" : "draft";
    await db.lesson.update({
      where: { id },
      data: {
        status: newStatus,
        version: lesson.version + 1,
      },
    });

    await db.auditEvent.create({
      data: {
        id: randomUUID(),
        actorId: user.id,
        action: "lesson.status_changed",
        subjectId: id,
        details: writeJson({
          previousStatus: lesson.status,
          newStatus,
          version: lesson.version + 1,
        }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to update lesson." }, { status: 500 });
  }
}
