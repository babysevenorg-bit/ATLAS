"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Notebook,
  Plus,
  X,
  Trash2,
  Edit3,
  Calendar as CalendarIcon,
  Tag,
  Link2,
  TrendingUp,
  Smile,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

type JournalEntry = {
  id: string;
  simOrderId: string | null;
  title: string;
  body: string;
  tags: string[];
  emotions: string[];
  screenshotUrl: string | null;
  moodRating: number; // 1..5
  createdAt: string;
  updatedAt: string;
};

type SimOrderLite = {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  status: "OPEN" | "CLOSED" | "CANCELLED";
  pnl: number;
  lots: number;
  openPrice: number;
  closePrice: number | null;
  openTime: string;
  closeTime: string | null;
};

type Props = {
  user: { id: string } | null;
};

const EMOTION_OPTIONS: { value: string; label: string; tone: "pos" | "neu" | "neg" }[] = [
  { value: "calm", label: "Calm", tone: "pos" },
  { value: "confident", label: "Confident", tone: "pos" },
  { value: "patient", label: "Patient", tone: "pos" },
  { value: "disciplined", label: "Disciplined", tone: "pos" },
  { value: "hopeful", label: "Hopeful", tone: "neu" },
  { value: "anxious", label: "Anxious", tone: "neg" },
  { value: "frustrated", label: "Frustrated", tone: "neg" },
  { value: "greedy", label: "Greedy", tone: "neg" },
  { value: "fomo", label: "FOMO", tone: "neg" },
  { value: "regretful", label: "Regretful", tone: "neg" },
];

const MOOD_LABELS: Record<number, string> = {
  1: "Shaky",
  2: "Off-balance",
  3: "Neutral",
  4: "Sharp",
  5: "Locked in",
};

const MOOD_COLORS: Record<number, string> = {
  1: "#e87a7a",
  2: "#e9a93a",
  3: "#c9c46a",
  4: "#88c08a",
  5: "#5fbf6f",
};

const EMOJI_BY_MOOD: Record<number, string> = {
  1: "😣",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "🚀",
};

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function dateKey(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function formatRelative(iso: string) {
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

export default function TradingJournal({ user }: Props) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [simOrders, setSimOrders] = useState<SimOrderLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeMonth, setActiveMonth] = useState(() => startOfMonth(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterEmotion, setFilterEmotion] = useState<string>("all");

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/journal")
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          if (Array.isArray(data.entries)) setEntries(data.entries);
          if (Array.isArray(data.simOrders)) setSimOrders(data.simOrders);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, refreshKey]);

  const simOrderMap = useMemo(() => {
    const m = new Map<string, SimOrderLite>();
    simOrders.forEach(o => m.set(o.id, o));
    return m;
  }, [simOrders]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => e.tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [entries]);

  const allEmotions = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => e.emotions.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterTag !== "all" && !e.tags.includes(filterTag)) return false;
      if (filterEmotion !== "all" && !e.emotions.includes(filterEmotion)) return false;
      return true;
    });
  }, [entries, filterTag, filterEmotion]);

  // Calendar grid for the active month.
  const calendarCells = useMemo(() => {
    const year = activeMonth.getUTCFullYear();
    const month = activeMonth.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month, 1));
    // 0 = Sunday ... 6 = Saturday — convert to Monday-first index.
    let weekday = firstDay.getUTCDay() - 1;
    if (weekday < 0) weekday = 6;
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const cells: { date: Date | null; entries: JournalEntry[] }[] = [];
    for (let i = 0; i < weekday; i++) cells.push({ date: null, entries: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(Date.UTC(year, month, d));
      const key = dateKey(date);
      const dayEntries = entries.filter(
        e => dateKey(new Date(e.createdAt)) === key
      );
      cells.push({ date, entries: dayEntries });
    }
    // pad to multiple of 7
    while (cells.length % 7 !== 0) cells.push({ date: null, entries: [] });
    return cells;
  }, [activeMonth, entries]);

  const analytics = useMemo(() => {
    if (entries.length === 0) {
      return {
        total: 0,
        avgMood: 0,
        topEmotions: [] as { emotion: string; count: number }[],
        entriesPerWeek: 0,
        positiveRatio: 0,
      };
    }
    const sumMood = entries.reduce((s, e) => s + e.moodRating, 0);
    const avgMood = sumMood / entries.length;
    const emotionCount = new Map<string, number>();
    entries.forEach(e => e.emotions.forEach(em => emotionCount.set(em, (emotionCount.get(em) || 0) + 1)));
    const topEmotions = Array.from(emotionCount.entries())
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    // entries per week (last 28 days)
    const cutoff = Date.now() - 28 * 24 * 60 * 60 * 1000;
    const recent = entries.filter(e => new Date(e.createdAt).getTime() >= cutoff);
    const entriesPerWeek = recent.length / 4;
    const positiveEmotions = new Set(["calm", "confident", "patient", "disciplined"]);
    const totalEmotions = entries.reduce((s, e) => s + e.emotions.length, 0);
    const positiveCount = entries.reduce(
      (s, e) => s + e.emotions.filter(em => positiveEmotions.has(em)).length,
      0
    );
    const positiveRatio = totalEmotions === 0 ? 0 : positiveCount / totalEmotions;
    return { total: entries.length, avgMood, topEmotions, entriesPerWeek, positiveRatio };
  }, [entries]);

  function prevMonth() {
    setActiveMonth(new Date(Date.UTC(activeMonth.getUTCFullYear(), activeMonth.getUTCMonth() - 1, 1)));
  }
  function nextMonth() {
    setActiveMonth(new Date(Date.UTC(activeMonth.getUTCFullYear(), activeMonth.getUTCMonth() + 1, 1)));
  }
  function jumpToToday() {
    setActiveMonth(startOfMonth(new Date()));
  }

  function openNewEntry() {
    setEditingEntry(null);
    setModalOpen(true);
  }
  function openEditEntry(entry: JournalEntry) {
    setEditingEntry(entry);
    setModalOpen(true);
  }

  function handleSaved(entry: JournalEntry) {
    setEntries(prev => {
      const existingIdx = prev.findIndex(e => e.id === entry.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = entry;
        return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return [entry, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    setModalOpen(false);
    setEditingEntry(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this journal entry? This cannot be undone.")) return;
    setEntries(prev => prev.filter(e => e.id !== id));
    try {
      await fetch("/api/journal/item", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setRefreshKey(k => k + 1);
    } catch {}
  }

  if (!user) {
    return (
      <div className="journal-container">
        <div className="journal-hero">
          <div className="journal-hero-left">
            <div className="kicker-badge"><Notebook size={15} /> TRADING JOURNAL</div>
            <h2>Reflect on every trade you take.</h2>
            <p>
              Sign in to capture mood ratings, emotional check-ins, post-trade reflections and
              trade-linked postmortems. Building a written record is the single highest-ROI habit
              separating disciplined learners from gamblers.
            </p>
          </div>
          <div className="journal-hero-right">
            <Notebook size={60} strokeWidth={1.2} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="journal-container">
      <div className="journal-hero">
        <div className="journal-hero-left">
          <div className="kicker-badge"><Notebook size={15} /> TRADING JOURNAL</div>
          <h2>Reflect on every trade you take<span className="title-dot">.</span></h2>
          <p>
            A reflective journal is the highest-leverage habit a developing trader can build. Pair
            each entry with a mood rating, emotional check-ins, and a link to the simulated trade
            it relates to. <strong>+10 XP</strong> awarded per saved entry.
          </p>
        </div>
        <div className="journal-hero-right">
          <button className="journal-new-btn" onClick={openNewEntry}>
            <Plus size={16} /> New Entry
          </button>
          <button className="journal-refresh-btn" onClick={refresh} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Analytics strip */}
      <div className="journal-stats-row">
        <div className="journal-stat-card">
          <span className="stat-label">ENTRIES</span>
          <strong className="stat-value">{analytics.total}</strong>
          <small className="stat-foot">total reflections logged</small>
        </div>
        <div className="journal-stat-card">
          <span className="stat-label">AVG MOOD</span>
          <strong
            className="stat-value"
            style={{ color: MOOD_COLORS[Math.round(analytics.avgMood) || 3] }}
          >
            {(analytics.avgMood || 0).toFixed(2)}
            <span className="stat-value-emoji">{EMOJI_BY_MOOD[Math.round(analytics.avgMood) || 3]}</span>
          </strong>
          <small className="stat-foot">on a 1–5 scale</small>
        </div>
        <div className="journal-stat-card">
          <span className="stat-label">ENTRIES / WEEK</span>
          <strong className="stat-value">{analytics.entriesPerWeek.toFixed(1)}</strong>
          <small className="stat-foot">rolling 4-week average</small>
        </div>
        <div className="journal-stat-card">
          <span className="stat-label">DISCIPLINE RATIO</span>
          <strong className="stat-value" style={{ color: "#5fbf6f" }}>
            {Math.round(analytics.positiveRatio * 100)}%
          </strong>
          <small className="stat-foot">calm / confident / patient / disciplined emotions</small>
        </div>
      </div>

      {/* Top emotions */}
      {analytics.topEmotions.length > 0 && (
        <div className="journal-emotions-bar">
          <div className="jeb-label">
            <Smile size={14} /> MOST FELT EMOTIONS
          </div>
          <div className="jeb-emotions">
            {analytics.topEmotions.map(({ emotion, count }) => {
              const meta = EMOTION_OPTIONS.find(o => o.value === emotion);
              const toneClass = meta ? `tone-${meta.tone}` : "tone-neu";
              return (
                <div key={emotion} className={`jeb-emotion ${toneClass}`}>
                  <span>{meta?.label || emotion}</span>
                  <strong>×{count}</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="journal-layout">
        {/* LEFT: Calendar */}
        <div className="journal-calendar-card">
          <div className="jcc-header">
            <div className="jcc-month">
              <CalendarIcon size={16} />
              <strong>
                {activeMonth.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </strong>
            </div>
            <div className="jcc-nav">
              <button onClick={prevMonth} aria-label="Previous month">‹</button>
              <button onClick={jumpToToday} className="today-btn">Today</button>
              <button onClick={nextMonth} aria-label="Next month">›</button>
            </div>
          </div>
          <div className="jcc-weekdays">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="jcc-grid">
            {calendarCells.map((cell, idx) => (
              <div
                key={idx}
                className={`jcc-cell ${cell.date ? "has-date" : "empty"} ${
                  cell.date && dateKey(cell.date) === dateKey(new Date()) ? "is-today" : ""
                }`}
                onClick={() =>
                  cell.date && cell.entries.length > 0
                    ? openEditEntry(cell.entries[0])
                    : cell.date
                    ? openNewEntry()
                    : undefined
                }
                title={
                  cell.date
                    ? cell.entries.length > 0
                      ? `${cell.entries.length} entr${cell.entries.length === 1 ? "y" : "ies"} on ${cell.date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}`
                      : cell.date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })
                    : undefined
                }
              >
                {cell.date && (
                  <>
                    <span className="jcc-day">{cell.date.getUTCDate()}</span>
                    {cell.entries.length > 0 && (
                      <div className="jcc-dots">
                        {cell.entries.slice(0, 4).map(e => (
                          <span
                            key={e.id}
                            className="jcc-dot"
                            style={{ background: MOOD_COLORS[e.moodRating] || "#888" }}
                          />
                        ))}
                        {cell.entries.length > 4 && (
                          <span className="jcc-more">+{cell.entries.length - 4}</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="jcc-legend">
            <span className="legend-label">MOOD:</span>
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} className="legend-item">
                <span className="legend-dot" style={{ background: MOOD_COLORS[n] }} />
                {n}
              </span>
            ))}
            <span className="legend-label">1 = Shaky · 5 = Locked in</span>
          </div>
        </div>

        {/* RIGHT: List of entries */}
        <div className="journal-list-card">
          <div className="jlc-header">
            <strong>All Entries</strong>
            <span>{filteredEntries.length} of {entries.length}</span>
          </div>

          {(allTags.length > 0 || allEmotions.length > 0) && (
            <div className="jlc-filters">
              <div className="filter-group">
                <Tag size={12} /> Tag:
                <select value={filterTag} onChange={e => setFilterTag(e.target.value)}>
                  <option value="all">All</option>
                  {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <Smile size={12} /> Emotion:
                <select value={filterEmotion} onChange={e => setFilterEmotion(e.target.value)}>
                  <option value="all">All</option>
                  {allEmotions.map(t => (
                    <option key={t} value={t}>
                      {EMOTION_OPTIONS.find(o => o.value === t)?.label || t}
                    </option>
                  ))}
                </select>
              </div>
              {(filterTag !== "all" || filterEmotion !== "all") && (
                <button
                  className="filter-clear"
                  onClick={() => {
                    setFilterTag("all");
                    setFilterEmotion("all");
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="jlc-list">
            {loading ? (
              <div className="jlc-empty">
                <Loader2 size={20} className="spin" />
                <span>Loading your entries…</span>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="jlc-empty">
                <Notebook size={32} strokeWidth={1.4} />
                <strong>No journal entries yet</strong>
                <p>Click <em>New Entry</em> or any calendar day to begin.</p>
              </div>
            ) : (
              filteredEntries.map(entry => {
                const linkedOrder = entry.simOrderId ? simOrderMap.get(entry.simOrderId) : null;
                return (
                  <article key={entry.id} className="jlc-entry">
                    <div className="jlc-entry-head">
                      <div className="jlc-mood-chip" title={`Mood ${entry.moodRating}/5`}>
                        <span
                          className="mood-dot"
                          style={{ background: MOOD_COLORS[entry.moodRating] }}
                        />
                        {MOOD_LABELS[entry.moodRating]}
                      </div>
                      <div className="jlc-entry-meta">
                        <span>{formatRelative(entry.createdAt)}</span>
                      </div>
                    </div>

                    <h4 className="jlc-entry-title">{entry.title}</h4>

                    {entry.body && (
                      <p className="jlc-entry-body">
                        {entry.body.length > 280 ? `${entry.body.slice(0, 280)}…` : entry.body}
                      </p>
                    )}

                    {linkedOrder && (
                      <div className="jlc-trade-link">
                        <Link2 size={13} />
                        <span>
                          Linked trade · <strong>{linkedOrder.symbol}</strong>{" "}
                          {linkedOrder.type} · {linkedOrder.lots} lots
                        </span>
                        <span
                          className="pnl-pill"
                          style={{
                            background:
                              linkedOrder.pnl > 0
                                ? "#dff3df"
                                : linkedOrder.pnl < 0
                                ? "#fde0e0"
                                : "#eef3ec",
                            color:
                              linkedOrder.pnl > 0
                                ? "#2a6a3a"
                                : linkedOrder.pnl < 0
                                ? "#a83a3a"
                                : "#4a6357",
                          }}
                        >
                          {linkedOrder.pnl > 0 ? "+" : ""}
                          ${linkedOrder.pnl.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {(entry.tags.length > 0 || entry.emotions.length > 0) && (
                      <div className="jlc-tags">
                        {entry.tags.map(t => (
                          <span key={t} className="jlc-tag">#{t}</span>
                        ))}
                        {entry.emotions.map(em => {
                          const meta = EMOTION_OPTIONS.find(o => o.value === em);
                          return (
                            <span key={em} className={`jlc-emotion tone-${meta?.tone || "neu"}`}>
                              {meta?.label || em}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="jlc-entry-actions">
                      <button onClick={() => openEditEntry(entry)}>
                        <Edit3 size={13} /> Edit
                      </button>
                      <button className="danger" onClick={() => handleDelete(entry.id)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <JournalEntryModal
          entry={editingEntry}
          simOrders={simOrders}
          onClose={() => {
            setModalOpen(false);
            setEditingEntry(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// =========================================================
// Modal
// =========================================================

type ModalProps = {
  entry: JournalEntry | null;
  simOrders: SimOrderLite[];
  onClose: () => void;
  onSaved: (entry: JournalEntry) => void;
};

function JournalEntryModal({ entry, simOrders, onClose, onSaved }: ModalProps) {
  const isEdit = !!entry;
  const [title, setTitle] = useState(entry?.title || "");
  const [body, setBody] = useState(entry?.body || "");
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [emotions, setEmotions] = useState<string[]>(entry?.emotions || []);
  const [moodRating, setMoodRating] = useState<number>(entry?.moodRating || 3);
  const [simOrderId, setSimOrderId] = useState<string>(entry?.simOrderId || "");
  const [screenshotUrl, setScreenshotUrl] = useState(entry?.screenshotUrl || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggleEmotion(value: string) {
    setEmotions(prev =>
      prev.includes(value) ? prev.filter(e => e !== value) : [...prev, value]
    );
  }

  function addTagFromInput() {
    const cleaned = tagInput
      .trim()
      .replace(/^#/, "")
      .toLowerCase()
      .slice(0, 24);
    if (!cleaned) return;
    if (tags.includes(cleaned)) {
      setTagInput("");
      return;
    }
    if (tags.length >= 12) return;
    setTags(prev => [...prev, cleaned]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(prev => prev.filter(x => x !== t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Please enter a title for this entry.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        title: trimmedTitle,
        body,
        tags,
        emotions,
        moodRating,
        simOrderId: simOrderId || null,
        screenshotUrl: screenshotUrl.trim() || null,
      };
      const res = isEdit
        ? await fetch("/api/journal/item", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: entry!.id, ...payload }),
          })
        : await fetch("/api/journal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Unable to save entry.");
        setBusy(false);
        return;
      }
      onSaved(data.entry);
    } catch {
      setError("Network error — please retry.");
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="journal-entry-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="jm-header">
          <div className="kicker-badge">
            <Notebook size={14} /> {isEdit ? "EDIT ENTRY" : "NEW ENTRY"}
          </div>
          <h3>{isEdit ? "Update reflection" : "Capture this moment"}</h3>
          <p>
            Be honest — the journal is private to you. Use it to identify patterns between your
            emotional state and your decision quality.
          </p>
        </div>

        {error && (
          <div className="jm-error">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <form className="jm-form" onSubmit={handleSubmit}>
          <label className="jm-field">
            <span className="jm-label">Title <em>*</em></span>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={140}
              placeholder="e.g. EUR/USD long — chased the breakout"
              autoFocus
            />
          </label>

          <label className="jm-field">
            <span className="jm-label">Reflection</span>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              maxLength={12000}
              rows={6}
              placeholder="What happened? What did you plan? What did you feel? What would you do differently?"
            />
            <span className="jm-hint">{body.length.toLocaleString()} / 12,000 chars</span>
          </label>

          {/* Mood slider */}
          <div className="jm-field">
            <span className="jm-label">Mood at decision time</span>
            <div className="jm-mood-row">
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={moodRating}
                onChange={e => setMoodRating(Number(e.target.value))}
                className="jm-mood-slider"
                style={
                  {
                    "--mood-color": MOOD_COLORS[moodRating],
                  } as React.CSSProperties
                }
              />
              <span
                className="jm-mood-pill"
                style={{ background: MOOD_COLORS[moodRating], color: "#163832" }}
              >
                {EMOJI_BY_MOOD[moodRating]} {MOOD_LABELS[moodRating]} ({moodRating}/5)
              </span>
            </div>
          </div>

          {/* Emotions */}
          <div className="jm-field">
            <span className="jm-label">Emotional check-in</span>
            <div className="jm-emotions-grid">
              {EMOTION_OPTIONS.map(opt => {
                const active = emotions.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`jm-emotion-chip tone-${opt.tone} ${active ? "active" : ""}`}
                    onClick={() => toggleEmotion(opt.value)}
                  >
                    {active && <CheckCircle2 size={12} />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="jm-field">
            <span className="jm-label">Tags</span>
            <div className="jm-tags-input">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTagFromInput();
                  }
                }}
                placeholder="Type a tag and press Enter…"
                maxLength={24}
              />
              <button type="button" onClick={addTagFromInput} disabled={!tagInput.trim()}>
                <Plus size={13} /> Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="jm-tags-list">
                {tags.map(t => (
                  <span key={t} className="jm-tag-chip">
                    #{t}
                    <button type="button" onClick={() => removeTag(t)} aria-label={`Remove ${t}`}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Link to SimOrder */}
          <div className="jm-field">
            <span className="jm-label">Link to a simulated trade <em>(optional)</em></span>
            <select
              value={simOrderId}
              onChange={e => setSimOrderId(e.target.value)}
              className="jm-select"
            >
              <option value="">— No linked trade —</option>
              {simOrders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.symbol} {o.type} · {o.lots} lots · {o.status}
                  {o.pnl ? ` · ${o.pnl > 0 ? "+" : ""}$${o.pnl.toFixed(2)}` : ""}
                  {" · "}{new Date(o.openTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </option>
              ))}
            </select>
            {simOrders.length === 0 && (
              <span className="jm-hint">
                Place a virtual order in the Trading Lab first to enable trade-linked postmortems.
              </span>
            )}
          </div>

          {/* Screenshot URL */}
          <label className="jm-field">
            <span className="jm-label">Chart screenshot URL <em>(optional)</em></span>
            <input
              type="url"
              value={screenshotUrl}
              onChange={e => setScreenshotUrl(e.target.value)}
              placeholder="https://…"
              maxLength={600}
            />
          </label>

          <div className="jm-actions">
            <button type="button" className="jm-cancel" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="jm-submit" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={15} className="spin" /> Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} /> {isEdit ? "Update Entry" : "Save Entry"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
