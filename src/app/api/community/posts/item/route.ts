import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getUser } from "@/lib/auth";
import { writeJson, readJson } from "@/db/schema";

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = new Set([
  "general",
  "forex-foundations",
  "technical-analysis",
  "risk-management",
  "trading-psychology",
  "binary-options",
  "strategies",
  "qna",
]);

const HIDE_THRESHOLD = 3;

function serializePost(
  post: {
    id: string;
    userId: string;
    title: string;
    body: string;
    category: string;
    tags: string;
    upvoteIds: string;
    pinned: boolean;
    flaggedCount: number;
    commentCount: number;
    createdAt: Date;
    updatedAt: Date;
  },
  authorName: string | null,
  viewerId?: string
) {
  const upvoteIds = readJson<string[]>(post.upvoteIds, []);
  const tags = readJson<string[]>(post.tags, []);
  return {
    id: post.id,
    userId: post.userId,
    title: post.title,
    body: post.body,
    category: post.category,
    tags,
    upvoteCount: upvoteIds.length,
    hasUpvoted: viewerId ? upvoteIds.includes(viewerId) : false,
    pinned: post.pinned,
    flaggedCount: post.flaggedCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: {
      id: post.userId,
      name: authorName || "Anonymous Trader",
    },
  };
}

// PATCH /api/community/posts/item — edit own post
// Body: { id, title?, body?, category?, tags? }
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to edit posts." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "Post id is required." }, { status: 400 });
    }

    const existing = await db.forumPost.findUnique({
      where: { id },
      select: {
        userId: true,
        title: true,
        body: true,
        category: true,
        tags: true,
        upvoteIds: true,
        pinned: true,
        flaggedCount: true,
        commentCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own posts." },
        { status: 403 }
      );
    }

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") {
      const title = body.title.trim().slice(0, 180);
      if (!title) {
        return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
      }
      data.title = title;
    }
    if (typeof body.body === "string") {
      const postBody = body.body.slice(0, 20000);
      if (!postBody.trim()) {
        return NextResponse.json({ error: "Body cannot be empty." }, { status: 400 });
      }
      data.body = postBody;
    }
    if (typeof body.category === "string") {
      const cat = String(body.category);
      if (ALLOWED_CATEGORIES.has(cat)) data.category = cat;
    }
    if (Array.isArray(body.tags)) {
      data.tags = writeJson(
        Array.from(new Set(body.tags.map((t: unknown) => String(t).trim()).filter(Boolean))).slice(0, 8)
      );
    }

    const updated = await db.forumPost.update({ where: { id }, data });
    const author = await db.user.findUnique({
      where: { id: updated.userId },
      select: { name: true },
    });

    return NextResponse.json({
      ok: true,
      post: serializePost(updated, author?.name || null, user.id),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to update post.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/community/posts/item — delete own post or admin
// Body: { id }
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to delete posts." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "Post id is required." }, { status: 400 });
    }

    const existing = await db.forumPost.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const isAdmin = ["owner", "administrator"].includes(user.role);
    if (existing.userId !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own posts." },
        { status: 403 }
      );
    }

    await db.forumPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to delete post.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/community/posts/item — actions: 'upvote' (toggle) or 'flag' (increment)
// Body: { id, action: 'upvote' | 'flag' }
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to vote or flag posts." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "");
    const action = String(body.action || "");
    if (!id || !action) {
      return NextResponse.json(
        { error: "id and action are required." },
        { status: 400 }
      );
    }

    const existing = await db.forumPost.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        body: true,
        category: true,
        tags: true,
        upvoteIds: true,
        pinned: true,
        flaggedCount: true,
        commentCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    if (action === "upvote") {
      const upvoteIds = readJson<string[]>(existing.upvoteIds, []);
      const idx = upvoteIds.indexOf(user.id);
      let newIds: string[];
      if (idx >= 0) {
        newIds = upvoteIds.filter(uid => uid !== user.id);
      } else {
        newIds = [...upvoteIds, user.id];
      }
      const updated = await db.forumPost.update({
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
        post: serializePost(updated, author?.name || null, user.id),
      });
    }

    if (action === "flag") {
      // One flag per user — track via a pseudo key in tags? For now, simple increment with cap.
      // We use flaggedCount as the moderation signal. Real production would track flaggerIds.
      const nextFlagged = Math.min(existing.flaggedCount + 1, 99);
      const updated = await db.forumPost.update({
        where: { id },
        data: { flaggedCount: nextFlagged },
      });
      const author = await db.user.findUnique({
        where: { id: updated.userId },
        select: { name: true },
      });
      return NextResponse.json({
        ok: true,
        action: "flagged",
        hidden: nextFlagged > HIDE_THRESHOLD,
        post: serializePost(updated, author?.name || null, user.id),
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to perform action.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
