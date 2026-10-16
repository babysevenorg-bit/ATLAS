"use client";

import React from "react";
import {
  BookOpen,
  TrendingUp,
  ShieldCheck,
  Brain,
  AlertTriangle,
  Check,
  Lock,
  Play,
  ArrowRight,
  Target,
  Clock,
} from "lucide-react";
import { LEARNING_PATHS, type Lesson } from "@/lib/curriculum";

type Props = {
  lessons: Lesson[];
  completedLessonIds: string[];
  onOpenLesson: (lessonId: string) => void;
  isAuthenticated: boolean;
};

const PATH_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  "forex-foundations": BookOpen,
  "technical-analysis": TrendingUp,
  "risk-management": ShieldCheck,
  "trading-psychology": Brain,
  "binary-options": AlertTriangle,
};

const PATH_COLORS: Record<string, { bg: string; accent: string; border: string }> = {
  "forex-foundations": { bg: "#0d2818", accent: "#c9ed85", border: "#5fbf6f" },
  "technical-analysis": { bg: "#1a1d28", accent: "#74c0fc", border: "#4dabf7" },
  "risk-management": { bg: "#28180d", accent: "#ffd43b", border: "#fab005" },
  "trading-psychology": { bg: "#28101a", accent: "#fa5252", border: "#e64980" },
  "binary-options": { bg: "#1d0d28", accent: "#b197fc", border: "#9775fa" },
};

export default function LearningPathRoadmap({
  lessons,
  completedLessonIds,
  onOpenLesson,
  isAuthenticated,
}: Props) {
  // Group lessons by pathId
  const lessonsByPath = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.pathId]) acc[lesson.pathId] = [];
    acc[lesson.pathId].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  // Sort lessons within each path by order
  Object.keys(lessonsByPath).forEach(pathId => {
    lessonsByPath[pathId].sort((a, b) => a.order - b.order);
  });

  return (
    <div className="curriculum-roadmap">
      <div className="roadmap-header">
        <div>
          <div className="roadmap-eyebrow">
            <Target size={12} /> YOUR LEARNING ARCHITECTURE
          </div>
          <h2>The Atlas Curriculum — 5 Paths to Mastery</h2>
          <p>
            Every lesson builds on the last. Follow the paths in order, or explore freely.
            {isAuthenticated
              ? " Your progress is saved automatically."
              : " You can browse and read lessons without registering — sign up to save your progress."}
          </p>
        </div>
        <div className="roadmap-stats">
          <div className="roadmap-stat">
            <strong>{completedLessonIds.length}</strong>
            <span>Completed</span>
          </div>
          <div className="roadmap-stat">
            <strong>{lessons.length}</strong>
            <span>Total Lessons</span>
          </div>
          <div className="roadmap-stat">
            <strong>{Math.round((completedLessonIds.length / Math.max(1, lessons.length)) * 100)}%</strong>
            <span>Through</span>
          </div>
        </div>
      </div>

      <div className="roadmap-overall-progress">
        <div className="roadmap-progress-bar">
          <div
            className="roadmap-progress-fill"
            style={{ width: `${(completedLessonIds.length / Math.max(1, lessons.length)) * 100}%` }}
          />
        </div>
      </div>

      <div className="roadmap-paths-grid">
        {LEARNING_PATHS.map((path, pathIdx) => {
          const pathLessons = lessonsByPath[path.id] || [];
          const pathCompleted = pathLessons.filter(l => completedLessonIds.includes(l.id)).length;
          const pathTotal = pathLessons.length;
          const pathProgress = pathTotal > 0 ? Math.round((pathCompleted / pathTotal) * 100) : 0;
          const Icon = PATH_ICONS[path.id] || BookOpen;
          const colors = PATH_COLORS[path.id] || PATH_COLORS["forex-foundations"];
          const isPathStarted = pathCompleted > 0;
          const isPathComplete = pathCompleted === pathTotal && pathTotal > 0;

          return (
            <div
              key={path.id}
              className={`roadmap-path-card ${isPathComplete ? "complete" : isPathStarted ? "started" : "not-started"}`}
              style={{ borderColor: isPathStarted ? colors.border : "#2a4a42" }}
            >
              {/* Path header */}
              <div className="roadmap-path-header" style={{ background: colors.bg }}>
                <div className="roadmap-path-icon" style={{ background: colors.accent + "22", color: colors.accent }}>
                  <Icon size={20} />
                </div>
                <div className="roadmap-path-meta">
                  <span className="roadmap-path-num">PATH {pathIdx + 1} OF {LEARNING_PATHS.length}</span>
                  <strong>{path.title}</strong>
                  <p>{path.prerequisitesDescription}</p>
                </div>
                <div className="roadmap-path-progress-ring">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                    <circle
                      cx="22" cy="22" r="18" fill="none"
                      stroke={colors.accent} strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${(pathProgress / 100) * 113.1} 113.1`}
                      transform="rotate(-90 22 22)"
                    />
                    <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="Manrope, sans-serif">
                      {pathProgress}%
                    </text>
                  </svg>
                </div>
              </div>

              {/* Lesson list */}
              <div className="roadmap-lesson-list">
                {pathLessons.length === 0 ? (
                  <div className="roadmap-empty-path">
                    <Clock size={14} />
                    <span>Lessons coming soon</span>
                  </div>
                ) : (
                  pathLessons.map((lesson, lessonIdx) => {
                    const isDone = completedLessonIds.includes(lesson.id);
                    const isPrevDone = lessonIdx === 0 || completedLessonIds.includes(pathLessons[lessonIdx - 1].id);
                    const isLocked = !isDone && !isPrevDone && lesson.prerequisiteId !== null;
                    const isCurrent = !isDone && isPrevDone && !isLocked;

                    return (
                      <button
                        key={lesson.id}
                        className={`roadmap-lesson-row ${isDone ? "done" : isCurrent ? "current" : isLocked ? "locked" : "available"}`}
                        onClick={() => !isLocked && onOpenLesson(lesson.id)}
                        disabled={isLocked}
                      >
                        <div className={`roadmap-lesson-marker ${isDone ? "done" : isCurrent ? "current" : isLocked ? "locked" : ""}`}>
                          {isDone ? (
                            <Check size={14} />
                          ) : isLocked ? (
                            <Lock size={12} />
                          ) : (
                            <span>{lessonIdx + 1}</span>
                          )}
                        </div>
                        <div className="roadmap-lesson-body">
                          <div className="roadmap-lesson-title-row">
                            <strong>{lesson.title}</strong>
                            <span className="roadmap-lesson-duration">{lesson.duration}m</span>
                          </div>
                          <p>{lesson.description}</p>
                        </div>
                        {!isLocked && (
                          <div className="roadmap-lesson-action">
                            {isDone ? (
                              <Check size={16} className="text-emerald-400" />
                            ) : (
                              <Play size={14} className="text-lime-300" fill="currentColor" />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Path footer */}
              {pathLessons.length > 0 && (
                <div className="roadmap-path-footer">
                  <span className="roadmap-path-stat">
                    {pathCompleted} / {pathTotal} lessons
                  </span>
                  {isPathComplete ? (
                    <span className="roadmap-path-badge complete">
                      <Check size={12} /> Path Complete
                    </span>
                  ) : isPathStarted ? (
                    <span className="roadmap-path-badge started">
                      In Progress
                    </span>
                  ) : (
                    <span className="roadmap-path-badge not-started">
                      Start Here <ArrowRight size={12} />
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
