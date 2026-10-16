"use client";

import React, { useEffect, useState } from "react";
import {
  Award,
  Lock,
  Check,
  TrendingUp,
  Flame,
  Star,
  Trophy,
  ShieldCheck,
  Target,
  Briefcase,
  Activity,
  AlertTriangle,
  SplitSquareVertical,
  BookOpen,
  GraduationCap,
  Library,
  Crown,
  Zap,
  Sparkles,
  Rocket,
  Compass,
  Calculator,
  Medal,
  RefreshCw,
} from "lucide-react";

type AchievementProgress = {
  def: {
    id: string;
    code: string;
    name: string;
    description: string;
    category: string;
    iconKey: string;
    tier: "bronze" | "silver" | "gold" | "platinum";
    xpReward: number;
  };
  unlocked: boolean;
  unlockedAt: string | null;
  current: number;
  target: number;
  progressPct: number;
};

type Props = {
  user: { id: string } | null;
};

// Map iconKey strings to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Award, BookOpen, GraduationCap, Library, Crown, Flame, Trophy, Star,
  ShieldCheck, Medal, TrendingUp, Activity, Briefcase, Target,
  SplitSquareVertical, AlertTriangle, Zap, Sparkles, Rocket, Compass, Calculator,
};

const TIER_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  bronze: { bg: "#fdf3e6", border: "#d9a05b", text: "#8a4a16", glow: "rgba(217, 160, 91, 0.3)" },
  silver: { bg: "#f0f4f6", border: "#9aa5b1", text: "#5a6470", glow: "rgba(154, 165, 177, 0.3)" },
  gold:   { bg: "#fff9e6", border: "#fcc419", text: "#8a6500", glow: "rgba(252, 196, 25, 0.4)" },
  platinum: { bg: "#f3f8fb", border: "#5fb3d9", text: "#1d4e6a", glow: "rgba(95, 179, 217, 0.45)" },
};

const CATEGORY_LABELS: Record<string, string> = {
  learning: "Learning & Curriculum",
  streak: "Consistency & Streaks",
  mastery: "Skill Mastery",
  simulation: "Simulation Practice",
  discipline: "Process Discipline",
  special: "Special Milestones",
};

export default function AchievementsGallery({ user }: Props) {
  const [data, setData] = useState<{
    achievements: AchievementProgress[];
    totalUnlocked: number;
    totalAvailable: number;
    totalXpFromAchievements: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Run skill decay pass first (non-blocking), then fetch achievements
    fetch("/api/cron/skill-decay", { method: "POST" })
      .catch(() => {})
      .finally(() => {
        fetch("/api/achievements")
          .then(r => r.json())
          .then(d => { if (d && !d.error) setData(d); })
          .catch(() => {})
          .finally(() => setLoading(false));
      });
  }, [user, refreshKey]);

  if (!user) {
    return (
      <div className="risk-lab-container">
        <div className="risk-lab-header">
          <div className="header-left">
            <div className="kicker-badge"><Award size={15} /> ACHIEVEMENT GALLERY</div>
            <h2>Unlock Your Trading Badges</h2>
            <p>Sign in to track your progress across 24 achievements spanning learning, mastery, simulation, discipline, streaks, and special milestones.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="risk-lab-container">
        <div className="risk-lab-header">
          <div className="header-left">
            <div className="kicker-badge"><Award size={15} /> ACHIEVEMENT GALLERY</div>
            <h2>Loading your achievements…</h2>
          </div>
        </div>
      </div>
    );
  }

  // Group achievements by category
  const categories = Array.from(new Set(data.achievements.map(a => a.def.category)));
  const filtered = filter === "all"
    ? data.achievements
    : data.achievements.filter(a => a.def.category === filter);

  return (
    <div className="risk-lab-container">
      <div className="risk-lab-header">
        <div className="header-left">
          <div className="kicker-badge"><Award size={15} /> ACHIEVEMENT GALLERY</div>
          <h2>Unlock Your Trading Badges</h2>
          <p>
            Healthy gamification — rewards recognise <strong>disciplined practice, knowledge retention,
            and curriculum mastery</strong>, never simulated profit or trade count. Every badge is earned
            through demonstrated evidence, not luck.
          </p>
        </div>
        <button
          className="universe-ctrl-btn"
          onClick={() => setRefreshKey(k => k + 1)}
          title="Re-evaluate achievements"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Summary banner */}
      <div className="achievements-summary-banner">
        <div className="summary-stat">
          <span>UNLOCKED</span>
          <strong style={{ color: "#69db7c" }}>{data.totalUnlocked}</strong>
          <small>of {data.totalAvailable}</small>
        </div>
        <div className="summary-stat">
          <span>COMPLETION</span>
          <strong>{Math.round((data.totalUnlocked / Math.max(1, data.totalAvailable)) * 100)}%</strong>
          <small>overall progress</small>
        </div>
        <div className="summary-stat">
          <span>XP FROM BADGES</span>
          <strong style={{ color: "#c9ed85" }}>+{data.totalXpFromAchievements}</strong>
          <small>bonus XP earned</small>
        </div>
        <div className="summary-progress-track">
          <div
            className="summary-progress-fill"
            style={{ width: `${(data.totalUnlocked / Math.max(1, data.totalAvailable)) * 100}%` }}
          />
        </div>
      </div>

      {/* Category filter pills */}
      <div className="achievement-filter-row">
        <button
          className={`filter-pill ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({data.achievements.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-pill ${filter === cat ? "active" : ""}`}
            onClick={() => setFilter(cat)}
          >
            {CATEGORY_LABELS[cat] || cat} ({data.achievements.filter(a => a.def.category === cat).length})
          </button>
        ))}
      </div>

      {/* Group by category when "all" is selected, else flat list */}
      {filter === "all" ? (
        categories.map(cat => (
          <div key={cat} className="achievement-category-block">
            <h3 className="category-block-title">{CATEGORY_LABELS[cat] || cat}</h3>
            <div className="achievement-grid">
              {data.achievements
                .filter(a => a.def.category === cat)
                .map(ap => <AchievementCard key={ap.def.id} progress={ap} />)}
            </div>
          </div>
        ))
      ) : (
        <div className="achievement-grid">
          {filtered.map(ap => <AchievementCard key={ap.def.id} progress={ap} />)}
        </div>
      )}
    </div>
  );
}

function AchievementCard({ progress }: { progress: AchievementProgress }) {
  const Icon = ICON_MAP[progress.def.iconKey] || Award;
  const tierColor = TIER_COLORS[progress.def.tier];
  const isUnlocked = progress.unlocked;

  return (
    <div
      className={`achievement-card ${isUnlocked ? "unlocked" : "locked"} tier-${progress.def.tier}`}
      style={isUnlocked ? {
        background: tierColor.bg,
        borderColor: tierColor.border,
        boxShadow: `0 4px 20px ${tierColor.glow}`,
      } : {}}
    >
      <div className="achievement-top-row">
        <div
          className="achievement-icon"
          style={isUnlocked ? {
            background: tierColor.border,
            color: "white",
          } : {}}
        >
          {isUnlocked ? <Icon size={22} /> : <Lock size={20} />}
        </div>
        <span className={`tier-badge tier-${progress.def.tier}`}>
          {progress.def.tier.toUpperCase()}
        </span>
      </div>

      <div className="achievement-body">
        <strong>{isUnlocked ? progress.def.name : "???"}</strong>
        <p>{progress.def.description}</p>
      </div>

      {isUnlocked ? (
        <div className="achievement-unlock-row">
          <div className="unlock-stamp">
            <Check size={12} />
            <span>Unlocked {progress.unlockedAt ? new Date(progress.unlockedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}</span>
          </div>
          {progress.def.xpReward > 0 && (
            <span className="xp-reward">+{progress.def.xpReward} XP</span>
          )}
        </div>
      ) : (
        <div className="achievement-progress-row">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${progress.progressPct}%`,
                background: tierColor.border,
              }}
            />
          </div>
          <span className="progress-numbers">
            {progress.current} / {progress.target}
          </span>
        </div>
      )}
    </div>
  );
}
