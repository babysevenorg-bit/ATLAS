import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
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
const PAGE_SIZE = 20;
const XP_AWARD_POST = 15;

type PostListRow = {
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
  authorName: string | null;
};

function serializePost(row: PostListRow, viewerId?: string) {
  const upvoteIds = readJson<string[]>(row.upvoteIds, []);
  const tags = readJson<string[]>(row.tags, []);
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    body: row.body,
    category: row.category,
    tags,
    upvoteCount: upvoteIds.length,
    hasUpvoted: viewerId ? upvoteIds.includes(viewerId) : false,
    pinned: row.pinned,
    flaggedCount: row.flaggedCount,
    commentCount: row.commentCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    author: {
      id: row.userId,
      name: row.authorName || "Anonymous Trader",
    },
  };
}

// GET /api/community/posts — list posts with filters
// Query params: category?, sort=hot|new|top?, page?, q? (search title)
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    const url = new URL(request.url);
    const category = url.searchParams.get("category") || "all";
    const sort = url.searchParams.get("sort") || "hot";
    const q = (url.searchParams.get("q") || "").trim();
    const pageRaw = Number(url.searchParams.get("page") || "1");
    const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1);
    const skip = (page - 1) * PAGE_SIZE;

    // Auto-modded posts (flagged > threshold) are hidden from the public feed.
    const prismaWhere: Record<string, unknown> = {
      flaggedCount: { lte: HIDE_THRESHOLD },
    };
    if (category && category !== "all" && ALLOWED_CATEGORIES.has(category)) {
      prismaWhere.category = category;
    }
    if (q) {
      prismaWhere.title = { contains: q, mode: "insensitive" };
    }

    // We always fetch newest-first from the DB then re-sort in JS for hot/top
    // because Prisma can't order by JSON array length natively.
    const take = PAGE_SIZE + 1; // fetch one extra to know if there's a next page

    const rawPosts = (await db.forumPost.findMany({
      where: prismaWhere as never,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    })) as unknown as PostListRow[];

    const authorIds = Array.from(new Set(rawPosts.map(p => p.userId)));
    const authors = authorIds.length
      ? await db.user.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, name: true },
        })
      : [];
    const authorMap = new Map(authors.map(a => [a.id, a.name]));
    const hydrated: PostListRow[] = rawPosts.map(p => ({
      ...p,
      authorName: authorMap.get(p.userId) || null,
    }));

    const hasMore = hydrated.length > PAGE_SIZE;
    let pageRows = hydrated.slice(0, PAGE_SIZE);

    if (sort === "top") {
      pageRows = [...pageRows].sort((a, b) => {
        const av = readJson<string[]>(a.upvoteIds, []).length;
        const bv = readJson<string[]>(b.upvoteIds, []).length;
        if (bv !== av) return bv - av;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } else if (sort === "hot") {
      pageRows = [...pageRows].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const av = readJson<string[]>(a.upvoteIds, []).length;
        const bv = readJson<string[]>(b.upvoteIds, []).length;
        if (bv !== av) return bv - av;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }
    // 'new' = already sorted by createdAt desc above.

    return NextResponse.json({
      posts: pageRows.map(r => serializePost(r, user?.id)),
      page,
      hasMore,
      sort,
      category,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Community feed unavailable.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/community/posts — create a new post (auth required, awards 15 XP)
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to start a discussion." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || "").trim().slice(0, 180);
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    const postBody = String(body.body || "").slice(0, 20000);
    if (!postBody.trim()) {
      return NextResponse.json({ error: "Body cannot be empty." }, { status: 400 });
    }
    const categoryRaw = String(body.category || "general");
    const category = ALLOWED_CATEGORIES.has(categoryRaw) ? categoryRaw : "general";
    const tags = Array.isArray(body.tags)
      ? Array.from(new Set(body.tags.map((t: unknown) => String(t).trim()).filter(Boolean))).slice(0, 8)
      : [];

    const id = randomUUID();
    const created = await db.forumPost.create({
      data: {
        id,
        userId: user.id,
        title,
        body: postBody,
        category,
        tags: writeJson(tags),
        upvoteIds: writeJson([]),
        pinned: false,
        flaggedCount: 0,
        commentCount: 0,
      },
    });

    // Award XP stipend for community contribution
    await db.user
      .update({
        where: { id: user.id },
        data: { experiencePoints: { increment: XP_AWARD_POST }, lastActiveAt: new Date() },
      })
      .catch(() => {});

    // Record a brief learning session so analytics picks up community activity
    await db.learningSession
      .create({
        data: {
          id: randomUUID(),
          userId: user.id,
          startedAt: new Date(),
          endedAt: new Date(),
          durationSec: 60,
          xpEarned: XP_AWARD_POST,
          activityType: "study",
        },
      })
      .catch(() => {});

    return NextResponse.json({
      ok: true,
      xpGained: XP_AWARD_POST,
      post: serializePost(
        {
          ...created,
          authorName: user.name,
        },
        user.id
      ),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to create post.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
