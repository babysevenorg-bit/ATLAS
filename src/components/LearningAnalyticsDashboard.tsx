"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  TrendingUp,
  Brain,
  Flame,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  Calendar,
  Award,
  RefreshCw,
} from "lucide-react";

type AnalyticsResponse = {
  totalXp: number;
  level: number;
  currentStreakDays: number;
  longestStreakDays: number;
  totalSessions: number;
  totalStudyMinutes: number;
  lessonsCompleted: number;
  assessmentsAnswered: number;
  avgSessionMinutes: number;
  // Activity heatmap (last 12 weeks, 7 rows × 12 cols, value 0-4)
  heatmap: { date: string; intensity: number; xp: number }[];
  // XP earned per day (last 14 days)
  xpTimeline: { date: string; xp: number }[];
  // Mastery distribution
  masteryDistribution: { state: string; count: number; color: string }[];
  // Retention curve — skills grouped by last-assessed bucket
  retentionBuckets: { label: string; count: number; decayRisk: "low" | "medium" | "high" }[];
  // Recent skill state transitions
  recentTransitions: {
    skillId: string;
    previousState: string;
    newState: string;
    delta: number;
    trigger: string;
    recordedAt: string;
  }[];
};

type Props = {
  user: { id: string; experiencePoints: number; streakDays: number; persona: string } | null;
};

const MASTERY_COLOR_MAP: Record<string, string> = {
  not_started: "#7c8b86",
  learning: "#74c0fc",
  developing: "#ffd43b",
  practising: "#ff922b",
  demonstrated: "#69db7c",
  needs_revision: "#ff6b6b",
};

const MASTERY_LABEL: Record<string, string> = {
  not_started: "Not Started",
  learning: "Learning",
  developing: "Developing",
  practising: "Practising",
  demonstrated: "Demonstrated",
  needs_revision: "Needs Revision",
};

export default function LearningAnalyticsDashboard({ user }: Props) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/analytics/learning")
      .then(r => r.json())
      .then(d => {
        if (d && !d.error) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, refreshKey]);

  if (!user) {
    return (
      <div className="risk-lab-container">
        <div className="risk-lab-header">
          <div className="header-left">
            <div className="kicker-badge">
              <Activity size={15} /> LEARNING ANALYTICS DASHBOARD
            </div>
            <h2>Study the Trajectory of Your Mastery</h2>
            <p>Sign in to unlock personalised learning velocity charts, retention decay curves, mastery distribution donuts, and a 12-week study heatmap.</p>
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
            <div className="kicker-badge">
              <Activity size={15} /> LEARNING ANALYTICS DASHBOARD
            </div>
            <h2>Loading your learning trajectory…</h2>
          </div>
        </div>
      </div>
    );
  }

  const maxXp = Math.max(1, ...data.xpTimeline.map(p => p.xp));

  return (
    <div className="risk-lab-container">
      <div className="risk-lab-header">
        <div className="header-left">
          <div className="kicker-badge">
            <Activity size={15} /> LEARNING ANALYTICS DASHBOARD
          </div>
          <h2>The Architecture of Your Learning</h2>
          <p>
            Every assessment you answer, every simulation you run, every revision card you flip — these are signals.
            This dashboard transforms raw signals into evidence: learning velocity, retention decay, mastery distribution, and study consistency.
          </p>
        </div>
        <button className="universe-ctrl-btn" onClick={() => setRefreshKey(k => k + 1)} title="Refresh analytics">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-tile">
          <Zap size={18} />
          <span>TOTAL XP</span>
          <strong>{data.totalXp.toLocaleString()}</strong>
          <p>Level {data.level}</p>
        </div>
        <div className="analytics-kpi-tile">
          <Flame size={18} />
          <span>CURRENT STREAK</span>
          <strong style={{ color: data.currentStreakDays >= 3 ? "#ff922b" : "#7c8b86" }}>
            {data.currentStreakDays} days
          </strong>
          <p>Best: {data.longestStreakDays} days</p>
        </div>
        <div className="analytics-kpi-tile">
          <Clock size={18} />
          <span>STUDY TIME</span>
          <strong>{Math.floor(data.totalStudyMinutes / 60)}h {data.totalStudyMinutes % 60}m</strong>
          <p>{data.totalSessions} sessions · {data.avgSessionMinutes}m avg</p>
        </div>
        <div className="analytics-kpi-tile">
          <Target size={18} />
          <span>LESSONS DONE</span>
          <strong>{data.lessonsCompleted}</strong>
          <p>{data.assessmentsAnswered} assessments answered</p>
        </div>
        <div className="analytics-kpi-tile">
          <Brain size={18} />
          <span>SKILLS DEMONSTRATED</span>
          <strong style={{ color: "#69db7c" }}>
            {data.masteryDistribution.find(m => m.state === "demonstrated")?.count || 0}
          </strong>
          <p>of {data.masteryDistribution.reduce((s, m) => s + m.count, 0)} tracked</p>
        </div>
      </div>

      {/* Two-column: XP Timeline + Mastery Donut */}
      <div className="analytics-grid-2col">
        {/* XP Velocity Chart */}
        <div className="risk-card" style={{ background: "white" }}>
          <div className="analytics-card-header">
            <TrendingUp size={16} />
            <h3>Learning Velocity — XP Earned per Day (last 14 days)</h3>
          </div>
          <div className="xp-velocity-chart">
            {data.xpTimeline.map((p, idx) => {
              const heightPct = (p.xp / maxXp) * 100;
              return (
                <div key={idx} className="xp-bar-col" title={`${p.date}: ${p.xp} XP`}>
                  <div className="xp-bar-track">
                    <div
                      className="xp-bar-fill"
                      style={{
                        height: `${Math.max(2, heightPct)}%`,
                        background: p.xp > 0 ? "linear-gradient(180deg, #c9ed85, #5fbf6f)" : "#eef3ec",
                      }}
                    />
                  </div>
                  <span className="xp-bar-label">
                    {new Date(p.date).toLocaleDateString(undefined, { weekday: "short" }).charAt(0)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="analytics-footnote">
            Total XP this window: <strong>{data.xpTimeline.reduce((s, p) => s + p.xp, 0)}</strong>
            {" · "}Consistency beats intensity — short daily sessions compound.
          </p>
        </div>

        {/* Mastery Distribution Donut */}
        <div className="risk-card" style={{ background: "white" }}>
          <div className="analytics-card-header">
            <Brain size={16} />
            <h3>Mastery State Distribution</h3>
          </div>
          <div className="mastery-donut-row">
            <div className="mastery-donut">
              <svg viewBox="0 0 120 120" width="160" height="160">
                {(() => {
                  const total = data.masteryDistribution.reduce((s, m) => s + m.count, 0);
                  if (total === 0) {
                    return <circle cx="60" cy="60" r="50" fill="none" stroke="#eef3ec" strokeWidth="14" />;
                  }
                  let offset = 0;
                  const circumference = 2 * Math.PI * 50;
                  return data.masteryDistribution
                    .filter(m => m.count > 0)
                    .map((m, idx) => {
                      const pct = m.count / total;
                      const dash = pct * circumference;
                      const seg = (
                        <circle
                          key={idx}
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke={m.color}
                          strokeWidth="14"
                          strokeDasharray={`${dash} ${circumference - dash}`}
                          strokeDashoffset={-offset}
                          transform="rotate(-90 60 60)"
                        />
                      );
                      offset += dash;
                      return seg;
                    });
                })()}
                <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="700" fill="#223e31" fontFamily="Manrope, sans-serif">
                  {data.masteryDistribution.reduce((s, m) => s + m.count, 0)}
                </text>
                <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#7c8b86" fontFamily="DM Sans, sans-serif">
                  SKILLS
                </text>
              </svg>
            </div>
            <div className="mastery-legend-list">
              {data.masteryDistribution.map(m => (
                <div key={m.state} className="mastery-legend-row">
                  <span className="legend-dot" style={{ background: m.color }} />
                  <span>{MASTERY_LABEL[m.state] || m.state}</span>
                  <strong>{m.count}</strong>
                  <small>{Math.round((m.count / Math.max(1, data.masteryDistribution.reduce((s, x) => s + x.count, 0))) * 100)}%</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap (12 weeks) */}
      <div className="risk-card" style={{ background: "white" }}>
        <div className="analytics-card-header">
          <Calendar size={16} />
          <h3>Study Consistency Heatmap — Last 12 Weeks</h3>
        </div>
        <div className="activity-heatmap">
          <div className="heatmap-weekday-labels">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>
          <div className="heatmap-grid">
            {Array.from({ length: 12 }).map((_, weekIdx) => (
              <div key={weekIdx} className="heatmap-week">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const flatIdx = weekIdx * 7 + dayIdx;
                  const cell = data.heatmap[flatIdx];
                  const intensity = cell?.intensity || 0;
                  return (
                    <div
                      key={dayIdx}
                      className={`heatmap-cell intensity-${intensity}`}
                      title={cell ? `${cell.date} · ${cell.xp} XP` : "No activity"}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="heatmap-scale">
            <span>Less</span>
            <div className="heatmap-cell intensity-0" />
            <div className="heatmap-cell intensity-1" />
            <div className="heatmap-cell intensity-2" />
            <div className="heatmap-cell intensity-3" />
            <div className="heatmap-cell intensity-4" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Retention Decay Curve + Recent Transitions */}
      <div className="analytics-grid-2col">
        <div className="risk-card" style={{ background: "white" }}>
          <div className="analytics-card-header">
            <Brain size={16} />
            <h3>Retention Decay Risk Profile</h3>
          </div>
          <p className="analytics-card-sub">
            Skills bucketed by when they were last assessed. The forgetting curve is real — without spaced revision, demonstrated skills decay into &quot;needs revision&quot;.
          </p>
          <div className="retention-buckets">
            {data.retentionBuckets.map((b, idx) => (
              <div key={idx} className={`retention-bucket risk-${b.decayRisk}`}>
                <div className="retention-bucket-header">
                  <span>{b.label}</span>
                  <strong>{b.count} skills</strong>
                </div>
                <div className="retention-bucket-bar">
                  <div
                    style={{
                      width: `${(b.count / Math.max(1, data.retentionBuckets.reduce((s, x) => s + x.count, 0))) * 100}%`,
                      background:
                        b.decayRisk === "high" ? "#ff6b6b"
                        : b.decayRisk === "medium" ? "#ffd43b"
                        : "#69db7c",
                    }}
                  />
                </div>
                {b.decayRisk === "high" && b.count > 0 && (
                  <div className="retention-warn">
                    <AlertTriangle size={11} />
                    <span>High decay risk — schedule revision</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="risk-card" style={{ background: "white" }}>
          <div className="analytics-card-header">
            <Award size={16} />
            <h3>Recent Skill State Transitions</h3>
          </div>
          <p className="analytics-card-sub">
            Append-only history of how your mastery has evolved. Every transition is evidence.
          </p>
          <div className="transitions-list">
            {data.recentTransitions.length === 0 ? (
              <div className="transitions-empty">
                <Activity size={20} />
                <p>No transitions recorded yet. Complete an assessment to start building your learning history.</p>
              </div>
            ) : (
              data.recentTransitions.map((t, idx) => (
                <div key={idx} className="transition-row">
                  <div className="transition-states">
                    <span className="transition-state" style={{ color: MASTERY_COLOR_MAP[t.previousState] }}>
                      {(MASTERY_LABEL[t.previousState] || t.previousState)}
                    </span>
                    <span className="transition-arrow">→</span>
                    <span className="transition-state" style={{ color: MASTERY_COLOR_MAP[t.newState] }}>
                      {(MASTERY_LABEL[t.newState] || t.newState)}
                    </span>
                  </div>
                  <div className="transition-meta">
                    <span className="transition-skill-id">{t.skillId}</span>
                    <span className="transition-trigger">{t.trigger}</span>
                    <span className="transition-time">
                      {new Date(t.recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className={`transition-delta ${t.delta >= 0 ? "positive" : "negative"}`}>
                    {t.delta >= 0 ? "+" : ""}{t.delta}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
