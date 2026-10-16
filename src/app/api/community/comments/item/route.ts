import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getUser } from "@/lib/auth";
import { writeJson, readJson } from "@/db/schema";

export const dynamic = "force-dynamic";

// POST /api/community/comments/item — toggle upvote on a comment.
// Body: { id, action: 'upvote' }
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to vote on comments." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "");
    const action = String(body.action || "upvote");
    if (!id) {
      return NextResponse.json({ error: "Comment id is required." }, { status: 400 });
    }

    const existing = await db.forumComment.findUnique({
      where: { id },
      select: {
        id: true,
        postId: true,
        userId: true,
        body: true,
        upvoteIds: true,
        createdAt: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Comment not found." }, { status: 404 });
    }

    if (action !== "upvote") {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const upvoteIds = readJson<string[]>(existing.upvoteIds, []);
    const idx = upvoteIds.indexOf(user.id);
    const newIds = idx >= 0 ? upvoteIds.filter(uid => uid !== user.id) : [...upvoteIds, user.id];

    const updated = await db.forumComment.update({
      where: { id },
      data: { upvoteIds: writeJson(newIds) },
    });

    const author = await db.user.findUnique({
      where: { id: updated.userId },
      select: { name: true },
    });

    return NextResponse.json({
      ok: true,
      action: idx >= 0 ? "unupvoted" : "upvoted",
      comment: {
        id: updated.id,
        postId: updated.postId,
        body: updated.body,
        upvoteCount: newIds.length,
        hasUpvoted: idx < 0,
        createdAt: updated.createdAt.toISOString(),
        author: {
          id: updated.userId,
          name: author?.name || "Anonymous Trader",
        },
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to vote on comment.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
