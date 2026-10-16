"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Plus,
  X,
  ArrowBigUp,
  Flag,
  Trash2,
  Edit3,
  ChevronLeft,
  Loader2,
  Search,
  AlertTriangle,
  ShieldCheck,
  Pin,
  CornerDownRight,
  Send,
  Flame,
  Clock,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

// =====================
// Types
// =====================
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  persona?: string;
  virtualBalance?: number;
  experiencePoints?: number;
} | null;

type Post = {
  id: string;
  userId: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  upvoteCount: number;
  hasUpvoted: boolean;
  pinned: boolean;
  flaggedCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string };
};

type Comment = {
  id: string;
  postId: string;
  body: string;
  upvoteCount: number;
  hasUpvoted: boolean;
  createdAt: string;
  author: { id: string; name: string };
};

// =====================
// Constants
// =====================
const CATEGORIES: { value: string; label: string; short: string }[] = [
  { value: "all", label: "All Discussions", short: "All" },
  { value: "general", label: "General", short: "General" },
  { value: "forex-foundations", label: "Forex Foundations", short: "Foundations" },
  { value: "technical-analysis", label: "Technical Analysis", short: "Tech Analysis" },
  { value: "risk-management", label: "Risk Management", short: "Risk" },
  { value: "trading-psychology", label: "Trading Psychology", short: "Psychology" },
  { value: "strategies", label: "Strategies", short: "Strategies" },
  { value: "qna", label: "Q&A", short: "Q&A" },
];

const CATEGORY_LABELS: Record<string, string> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.value]: c.label }),
  {}
);

const SORTS: { value: "hot" | "new" | "top"; label: string; icon: React.ReactNode }[] = [
  { value: "hot", label: "Hot", icon: <Flame size={14} /> },
  { value: "new", label: "New", icon: <Clock size={14} /> },
  { value: "top", label: "Top", icon: <TrendingUp size={14} /> },
];

const CATEGORY_OPTIONS_FOR_NEW_POST = CATEGORIES.filter(c => c.value !== "all");

// =====================
// Helpers
// =====================
function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: diffDay > 365 ? "numeric" : undefined,
  });
}

// =====================
// Component
// =====================
type Props = {
  user: User;
};

export default function CommunityHub({ user }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"hot" | "new" | "top">("hot");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [category, sort, searchDebounced]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        category,
        sort,
        page: String(page),
      });
      if (searchDebounced) params.set("q", searchDebounced);
      const res = await fetch(`/api/community/posts?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load posts");
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setHasMore(!!data.hasMore);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [category, sort, page, searchDebounced]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }

  async function handleCreatePost(payload: {
    title: string;
    body: string;
    category: string;
    tags: string[];
  }) {
    if (!user) {
      showToast("Sign in to start a discussion.");
      return;
    }
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Failed to create post.");
      return;
    }
    if (data.post) {
      setPosts(prev => [data.post, ...prev]);
      showToast(data.xpGained ? `Posted! +${data.xpGained} XP` : "Posted!");
    }
    setComposerOpen(false);
  }

  async function handleDeletePost(postId: string) {
    if (!user) return;
    if (!confirm("Delete this post permanently? Comments will be removed too.")) return;
    const res = await fetch("/api/community/posts/item", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || "Failed to delete.");
      return;
    }
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (selectedPostId === postId) setSelectedPostId(null);
    showToast("Post deleted.");
  }

  async function handleEditPost(postId: string, patch: Partial<Pick<Post, "title" | "body" | "category" | "tags">>) {
    const res = await fetch("/api/community/posts/item", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId, ...patch }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || "Failed to update.");
      return null;
    }
    if (data.post) {
      setPosts(prev => prev.map(p => (p.id === postId ? data.post : p)));
      showToast("Post updated.");
    }
    return data.post || null;
  }

  async function togglePostUpvote(post: Post) {
    if (!user) {
      showToast("Sign in to upvote.");
      return;
    }
    // Optimistic update
    const wasUpvoted = post.hasUpvoted;
    setPosts(prev =>
      prev.map(p =>
        p.id === post.id
          ? {
              ...p,
              hasUpvoted: !wasUpvoted,
              upvoteCount: wasUpvoted ? Math.max(0, p.upvoteCount - 1) : p.upvoteCount + 1,
            }
          : p
      )
    );
    try {
      const res = await fetch("/api/community/posts/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, action: "upvote" }),
      });
      const data = await res.json();
      if (res.ok && data.post) {
        setPosts(prev => prev.map(p => (p.id === post.id ? data.post : p)));
      } else if (!res.ok) {
        // Roll back
        setPosts(prev =>
          prev.map(p =>
            p.id === post.id
              ? {
                  ...p,
                  hasUpvoted: wasUpvoted,
                  upvoteCount: wasUpvoted ? p.upvoteCount + 1 : Math.max(0, p.upvoteCount - 1),
                }
              : p
          )
        );
        showToast(data.error || "Failed to vote.");
      }
    } catch {
      // Roll back silently
      setPosts(prev =>
        prev.map(p =>
          p.id === post.id
            ? {
                ...p,
                hasUpvoted: wasUpvoted,
                upvoteCount: wasUpvoted ? p.upvoteCount + 1 : Math.max(0, p.upvoteCount - 1),
              }
            : p
        )
      );
    }
  }

  async function handleFlagPost(post: Post) {
    if (!user) {
      showToast("Sign in to flag posts.");
      return;
    }
    if (!confirm("Flag this post for moderator review? Abusive posts are hidden automatically after multiple flags.")) return;
    const res = await fetch("/api/community/posts/item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, action: "flag" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || "Failed to flag.");
      return;
    }
    if (data.post) {
      setPosts(prev => prev.map(p => (p.id === post.id ? data.post : p)));
    }
    if (data.hidden) {
      setPosts(prev => prev.filter(p => p.id !== post.id));
      showToast("Post flagged and hidden pending review.");
    } else {
      showToast("Post flagged. Thanks for keeping the community clean.");
    }
  }

  const selectedPost = useMemo(
    () => posts.find(p => p.id === selectedPostId) || null,
    [posts, selectedPostId]
  );

  // =====================
  // Render
  // =====================
  return (
    <div className="community-container">
      {/* HERO */}
      <div className="community-hero">
        <div className="community-hero-left">
          <span className="kicker-badge">
            <MessageCircle size={12} /> FR-080 · PEER LEARNING
          </span>
          <h2>Community &amp; Peer Learning<span className="title-dot">.</span></h2>
          <p>
            Discuss strategies, share trade reflections, and ask questions. <strong>Educational discussion only</strong> — no
            personalized financial advice, no signal-selling, no pump-and-dump promotion.
          </p>
        </div>
        <div className="community-hero-right">
          <button
            className="community-new-btn"
            onClick={() => {
              if (!user) {
                showToast("Sign in to start a discussion.");
                return;
              }
              setComposerOpen(true);
            }}
          >
            <Plus size={16} /> New Post
          </button>
          <button
            className="community-refresh-btn"
            onClick={() => void loadPosts()}
            title="Refresh feed"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* GUARDRAIL NOTICE */}
      <div className="community-guardrail">
        <ShieldCheck size={15} />
        <span>
          <strong>Community Guardrails:</strong> No personalized financial advice. No signal-selling.
          No promotional links to brokers or paid groups. Posts violating these rules may be flagged
          by peers and hidden automatically after {3} flags. Be respectful, stay educational.
        </span>
      </div>

      {/* FILTER BAR */}
      <div className="community-toolbar">
        <div className="community-categories">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              className={`community-pill ${category === c.value ? "active" : ""}`}
              onClick={() => setCategory(c.value)}
            >
              {c.short}
            </button>
          ))}
        </div>
        <div className="community-sort-search">
          <div className="community-search">
            <Search size={15} />
            <input
              aria-label="Search posts"
              placeholder="Search discussions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="community-sorts">
            {SORTS.map(s => (
              <button
                key={s.value}
                className={`community-sort-btn ${sort === s.value ? "active" : ""}`}
                onClick={() => setSort(s.value)}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN BODY */}
      {selectedPost ? (
        <PostDetail
          post={selectedPost}
          user={user}
          onBack={() => setSelectedPostId(null)}
          onUpvote={togglePostUpvote}
          onDelete={handleDeletePost}
          onEdit={handleEditPost}
          onFlag={handleFlagPost}
          showToast={showToast}
        />
      ) : (
        <PostList
          posts={posts}
          loading={loading}
          error={error}
          page={page}
          hasMore={hasMore}
          onPrev={() => setPage(p => Math.max(1, p - 1))}
          onNext={() => setPage(p => p + 1)}
          onOpen={id => setSelectedPostId(id)}
          onUpvote={togglePostUpvote}
          onFlag={handleFlagPost}
          user={user}
        />
      )}

      {/* COMPOSER MODAL */}
      {composerOpen && (
        <Composer
          onClose={() => setComposerOpen(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div className="community-toast">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

// =====================
// PostList sub-component
// =====================
function PostList({
  posts,
  loading,
  error,
  page,
  hasMore,
  onPrev,
  onNext,
  onOpen,
  onUpvote,
  onFlag,
  user,
}: {
  posts: Post[];
  loading: boolean;
  error: string;
  page: number;
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpen: (id: string) => void;
  onUpvote: (post: Post) => void;
  onFlag: (post: Post) => void;
  user: User;
}) {
  if (loading && posts.length === 0) {
    return (
      <div className="community-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="community-skeleton" key={i}>
            <div className="skeleton-row skeleton-w-60" />
            <div className="skeleton-row skeleton-w-40" />
            <div className="skeleton-row skeleton-w-80" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="community-empty">
        <AlertTriangle size={28} />
        <p>{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="community-empty">
        <MessageCircle size={28} />
        <h3>No discussions yet</h3>
        <p>
          {user
            ? "Be the first to start a conversation. Share a strategy insight, ask a question, or post a reflection."
            : "Sign in to start the first discussion in this category."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="community-list">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onOpen={() => onOpen(post.id)}
            onUpvote={() => onUpvote(post)}
            onFlag={() => onFlag(post)}
            canModerate={!!user && (user.id === post.userId || ["owner", "administrator"].includes(user.role))}
          />
        ))}
      </div>
      <div className="community-pager">
        <button className="community-page-btn" onClick={onPrev} disabled={page <= 1}>
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="community-page-info">Page {page}</span>
        <button className="community-page-btn" onClick={onNext} disabled={!hasMore}>
          Next <ChevronLeft size={14} className="flip-x" />
        </button>
      </div>
    </>
  );
}

// =====================
// PostCard sub-component
// =====================
function PostCard({
  post,
  onOpen,
  onUpvote,
  onFlag,
  canModerate,
}: {
  post: Post;
  onOpen: () => void;
  onUpvote: () => void;
  onFlag: () => void;
  canModerate: boolean;
}) {
  return (
    <article
      className={`community-card ${post.pinned ? "pinned" : ""}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="community-card-vote">
        <button
          className={`upvote-btn ${post.hasUpvoted ? "active" : ""}`}
          onClick={e => {
            e.stopPropagation();
            onUpvote();
          }}
          aria-label="Upvote"
          title="Upvote"
        >
          <ArrowBigUp size={18} />
        </button>
        <span className="upvote-count">{post.upvoteCount}</span>
      </div>

      <div className="community-card-body">
        <div className="community-card-header">
          <div className="community-card-title-row">
            {post.pinned && (
              <span className="community-pin" title="Pinned">
                <Pin size={12} />
              </span>
            )}
            <h3 className="community-card-title">{post.title}</h3>
          </div>
          <span className={`community-category-badge cat-${post.category}`}>
            {CATEGORY_LABELS[post.category] || post.category}
          </span>
        </div>
        <p className="community-card-excerpt">
          {post.body.length > 220 ? `${post.body.slice(0, 220).trimEnd()}…` : post.body}
        </p>
        {post.tags.length > 0 && (
          <div className="community-card-tags">
            {post.tags.slice(0, 6).map(t => (
              <span key={t} className="community-tag">#{t}</span>
            ))}
          </div>
        )}
        <div className="community-card-meta">
          <span className="community-author">
            <span className="community-avatar-mini">{post.author.name.charAt(0).toUpperCase()}</span>
            {post.author.name}
          </span>
          <span className="community-dot">·</span>
          <span className="community-time">{timeAgo(post.createdAt)}</span>
          <span className="community-dot">·</span>
          <span className="community-comments">
            <MessageCircle size={12} /> {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
          </span>
          {canModerate && (
            <>
              <span className="community-dot">·</span>
              <button
                className="community-flag-btn"
                onClick={e => {
                  e.stopPropagation();
                  onFlag();
                }}
                title="Flag for moderation"
              >
                <Flag size={12} /> Flag
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

// =====================
// PostDetail sub-component
// =====================
function PostDetail({
  post,
  user,
  onBack,
  onUpvote,
  onDelete,
  onEdit,
  onFlag,
  showToast,
}: {
  post: Post;
  user: User;
  onBack: () => void;
  onUpvote: (post: Post) => void;
  onDelete: (id: string) => void;
  onEdit: (
    postId: string,
    patch: Partial<Pick<Post, "title" | "body" | "category" | "tags">>
  ) => Promise<Post | null>;
  onFlag: (post: Post) => void;
  showToast: (m: string) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(post.title);
  const [editBody, setEditBody] = useState(post.body);
  const [editCategory, setEditCategory] = useState(post.category);
  const [editTags, setEditTags] = useState(post.tags.join(", "));

  // Sync edit form when post changes
  useEffect(() => {
    setEditTitle(post.title);
    setEditBody(post.body);
    setEditCategory(post.category);
    setEditTags(post.tags.join(", "));
  }, [post.id, post.title, post.body, post.category, post.tags]);

  // Load comments
  useEffect(() => {
    let cancelled = false;
    setCommentsLoading(true);
    fetch(`/api/community/comments?postId=${encodeURIComponent(post.id)}`, { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (Array.isArray(data.comments)) setComments(data.comments);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  async function submitComment() {
    if (!user) {
      showToast("Sign in to comment.");
      return;
    }
    const body = commentDraft.trim();
    if (!body) return;
    setCommentBusy(true);
    try {
      const res = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to comment.");
        return;
      }
      if (data.comment) {
        setComments(prev => [...prev, data.comment]);
        setCommentDraft("");
        showToast(data.xpGained ? `Comment posted! +${data.xpGained} XP` : "Comment posted.");
      }
    } finally {
      setCommentBusy(false);
    }
  }

  async function toggleCommentUpvote(comment: Comment) {
    if (!user) {
      showToast("Sign in to upvote.");
      return;
    }
    const wasUpvoted = comment.hasUpvoted;
    setComments(prev =>
      prev.map(c =>
        c.id === comment.id
          ? {
              ...c,
              hasUpvoted: !wasUpvoted,
              upvoteCount: wasUpvoted ? Math.max(0, c.upvoteCount - 1) : c.upvoteCount + 1,
            }
          : c
      )
    );
    try {
      const res = await fetch("/api/community/comments/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: comment.id, action: "upvote" }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments(prev => prev.map(c => (c.id === comment.id ? data.comment : c)));
      }
    } catch {
      // best-effort
    }
  }

  async function saveEdit() {
    const tags = editTags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean)
      .slice(0, 8);
    const updated = await onEdit(post.id, {
      title: editTitle.trim(),
      body: editBody,
      category: editCategory,
      tags,
    });
    if (updated) setEditing(false);
  }

  const canEdit = !!user && user.id === post.userId;
  const canDelete = !!user && (user.id === post.userId || ["owner", "administrator"].includes(user.role));

  return (
    <div className="community-detail">
      <button className="community-back-btn" onClick={onBack}>
        <ChevronLeft size={16} /> Back to feed
      </button>

      <article className="community-detail-card">
        <div className="community-detail-header">
          <div className="community-detail-title-row">
            {post.pinned && (
              <span className="community-pin" title="Pinned">
                <Pin size={14} />
              </span>
            )}
            {editing ? (
              <input
                className="community-edit-title"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                maxLength={180}
              />
            ) : (
              <h2 className="community-detail-title">{post.title}</h2>
            )}
          </div>
          <span className={`community-category-badge cat-${post.category}`}>
            {CATEGORY_LABELS[post.category] || post.category}
          </span>
        </div>

        <div className="community-detail-meta">
          <span className="community-author">
            <span className="community-avatar-mini">{post.author.name.charAt(0).toUpperCase()}</span>
            {post.author.name}
          </span>
          <span className="community-dot">·</span>
          <span className="community-time">{timeAgo(post.createdAt)}</span>
          {post.createdAt !== post.updatedAt && (
            <>
              <span className="community-dot">·</span>
              <span className="community-time">edited {timeAgo(post.updatedAt)}</span>
            </>
          )}
        </div>

        {editing ? (
          <textarea
            className="community-edit-body"
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            rows={10}
            maxLength={20000}
          />
        ) : (
          <div className="community-detail-body">
            {post.body.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}

        {editing ? (
          <>
            <div className="community-edit-controls">
              <select
                className="community-edit-select"
                value={editCategory}
                onChange={e => setEditCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS_FOR_NEW_POST.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input
                className="community-edit-tags"
                value={editTags}
                onChange={e => setEditTags(e.target.value)}
                placeholder="tags, comma separated"
              />
            </div>
            <div className="community-edit-actions">
              <button className="community-save-btn" onClick={saveEdit}>
                <ShieldCheck size={14} /> Save changes
              </button>
              <button className="community-cancel-btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {post.tags.length > 0 && (
              <div className="community-detail-tags">
                {post.tags.map(t => (
                  <span key={t} className="community-tag">#{t}</span>
                ))}
              </div>
            )}
            <div className="community-detail-actions">
              <button
                className={`upvote-pill ${post.hasUpvoted ? "active" : ""}`}
                onClick={() => onUpvote(post)}
              >
                <ArrowBigUp size={16} /> {post.upvoteCount}
              </button>
              <span className="community-detail-count">
                <MessageCircle size={14} /> {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
              </span>
              <div className="community-detail-spacer" />
              {canEdit && (
                <button className="community-icon-btn" onClick={() => setEditing(true)} title="Edit post">
                  <Edit3 size={14} /> Edit
                </button>
              )}
              {canDelete && (
                <button className="community-icon-btn danger" onClick={() => onDelete(post.id)} title="Delete post">
                  <Trash2 size={14} /> Delete
                </button>
              )}
              <button className="community-icon-btn" onClick={() => onFlag(post)} title="Flag for moderation">
                <Flag size={14} /> Flag
              </button>
            </div>
          </>
        )}
      </article>

      {/* COMMENT COMPOSER */}
      <div className="community-comment-composer">
        <h4>
          <CornerDownRight size={14} /> Add a comment
        </h4>
        {user ? (
          <>
            <textarea
              className="community-comment-input"
              value={commentDraft}
              onChange={e => setCommentDraft(e.target.value)}
              placeholder="Share your perspective, ask a clarifying question, or build on the discussion..."
              rows={3}
              maxLength={6000}
            />
            <div className="community-comment-actions">
              <span className="community-char-count">{commentDraft.length} / 6000</span>
              <button
                className="community-comment-submit"
                onClick={submitComment}
                disabled={!commentDraft.trim() || commentBusy}
              >
                {commentBusy ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                Post comment
              </button>
            </div>
          </>
        ) : (
          <p className="community-comment-guest">Sign in to join this discussion.</p>
        )}
      </div>

      {/* COMMENTS LIST */}
      <div className="community-comments">
        <h4>{comments.length} {comments.length === 1 ? "comment" : "comments"}</h4>
        {commentsLoading ? (
          <div className="community-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="community-skeleton" key={i}>
                <div className="skeleton-row skeleton-w-30" />
                <div className="skeleton-row skeleton-w-90" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="community-empty-mini">
            <MessageCircle size={22} />
            <p>No comments yet. Start the conversation.</p>
          </div>
        ) : (
          <ul className="community-comment-list">
            {comments.map(c => (
              <li key={c.id} className="community-comment">
                <div className="community-comment-vote">
                  <button
                    className={`upvote-btn sm ${c.hasUpvoted ? "active" : ""}`}
                    onClick={() => toggleCommentUpvote(c)}
                    aria-label="Upvote comment"
                    title="Upvote"
                  >
                    <ArrowBigUp size={14} />
                  </button>
                  <span className="upvote-count">{c.upvoteCount}</span>
                </div>
                <div className="community-comment-body">
                  <div className="community-comment-meta">
                    <span className="community-author">
                      <span className="community-avatar-mini">{c.author.name.charAt(0).toUpperCase()}</span>
                      {c.author.name}
                    </span>
                    <span className="community-dot">·</span>
                    <span className="community-time">{timeAgo(c.createdAt)}</span>
                  </div>
                  <div className="community-comment-text">
                    {c.body.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// =====================
// Composer modal
// =====================
function Composer({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    body: string;
    category: string;
    tags: string[];
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    const tags = tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(Boolean)
      .slice(0, 8);
    onSubmit({ title: title.trim(), body, category, tags });
    setSubmitting(false);
  }

  return (
    <div className="community-modal-backdrop" onClick={onClose}>
      <div
        className="community-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="New community post"
      >
        <div className="community-modal-header">
          <div>
            <span className="kicker-badge">
              <Plus size={12} /> NEW DISCUSSION
            </span>
            <h3>Start a discussion</h3>
          </div>
          <button className="community-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="community-modal-body">
          <label className="community-field-label">Title</label>
          <input
            className="community-input"
            placeholder="What's your question, insight, or reflection?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={180}
            autoFocus
          />

          <div className="community-field-row">
            <div className="community-field-col">
              <label className="community-field-label">Category</label>
              <select
                className="community-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS_FOR_NEW_POST.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="community-field-col grow">
              <label className="community-field-label">Tags (comma separated)</label>
              <input
                className="community-input"
                placeholder="eurusd, price-action, breakout"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
              />
            </div>
          </div>

          <label className="community-field-label">Body</label>
          <textarea
            className="community-textarea"
            placeholder="Share context, your question, or the discussion you'd like to start. Educational discussion only — no personalized advice or signal-selling."
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={8}
            maxLength={20000}
          />
          <div className="community-char-row">
            <span className="community-char-count">{body.length} / 20000</span>
          </div>

          <div className="community-modal-guardrail">
            <ShieldCheck size={13} />
            <span>Educational discussion only. No personalized financial advice or signal-selling.</span>
          </div>
        </div>

        <div className="community-modal-footer">
          <button className="community-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="community-new-btn"
            onClick={handleSubmit}
            disabled={!title.trim() || !body.trim() || submitting}
          >
            {submitting ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
            Publish post
          </button>
        </div>
      </div>
    </div>
  );
}
