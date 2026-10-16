import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { getUser } from "@/lib/auth";
import { writeJson, readJson } from "@/db/schema";

export const dynamic = "force-dynamic";

const XP_AWARD_COMMENT = 5;

type CommentRow = {
  id: string;
  postId: string;
  userId: string;
  body: string;
  upvoteIds: string;
  createdAt: Date;
  authorName: string | null;
};

function serializeComment(row: CommentRow, viewerId?: string) {
  const upvoteIds = readJson<string[]>(row.upvoteIds, []);
  return {
    id: row.id,
    postId: row.postId,
    body: row.body,
    upvoteCount: upvoteIds.length,
    hasUpvoted: viewerId ? upvoteIds.includes(viewerId) : false,
    createdAt: row.createdAt.toISOString(),
    author: {
      id: row.userId,
      name: row.authorName || "Anonymous Trader",
    },
  };
}

// GET /api/community/comments?postId=...
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    const url = new URL(request.url);
    const postId = url.searchParams.get("postId") || "";
    if (!postId) {
      return NextResponse.json({ error: "postId is required." }, { status: 400 });
    }

    const comments = (await db.forumComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      take: 200,
    })) as unknown as CommentRow[];

    const authorIds = Array.from(new Set(comments.map(c => c.userId)));
    const authors = authorIds.length
      ? await db.user.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, name: true },
        })
      : [];
    const authorMap = new Map(authors.map(a => [a.id, a.name]));
    const hydrated: CommentRow[] = comments.map(c => ({
      ...c,
      authorName: authorMap.get(c.userId) || null,
    }));

    return NextResponse.json({
      comments: hydrated.map(c => serializeComment(c, user?.id)),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Comments unavailable.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/community/comments — create comment (auth required, awards 5 XP)
// Body: { postId, body }
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to join the conversation." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const postId = String(body.postId || "");
    if (!postId) {
      return NextResponse.json({ error: "postId is required." }, { status: 400 });
    }
    const commentBody = String(body.body || "").slice(0, 6000);
    if (!commentBody.trim()) {
      return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
    }

    // Ensure the post exists and is viewable (not auto-modded)
    const post = await db.forumPost.findUnique({
      where: { id: postId },
      select: { id: true, flaggedCount: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    if (post.flaggedCount > 3) {
      return NextResponse.json(
        { error: "This post is no longer available." },
        { status: 410 }
      );
    }

    const id = randomUUID();
    const created = await db.forumComment.create({
      data: {
        id,
        postId,
        userId: user.id,
        body: commentBody,
        upvoteIds: writeJson([]),
      },
    });

    // Increment commentCount on the post atomically.
    await db.forumPost
      .update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      })
      .catch(() => {});

    // Award XP stipend for engagement
    await db.user
      .update({
        where: { id: user.id },
        data: { experiencePoints: { increment: XP_AWARD_COMMENT }, lastActiveAt: new Date() },
      })
      .catch(() => {});

    return NextResponse.json({
      ok: true,
      xpGained: XP_AWARD_COMMENT,
      comment: serializeComment(
        { ...created, authorName: user.name },
        user.id
      ),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to post comment.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
