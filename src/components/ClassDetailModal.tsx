"use client";

import React from "react";
import {
  X,
  Play,
  Plus,
  Check,
  Star,
  Clock,
  Sparkles,
  ShieldCheck,
  Layers,
  ChevronRight,
  BookOpen,
  LockKeyhole,
  CheckCircle2,
  Cpu,
  User,
  ExternalLink,
  Flame,
  Award
} from "lucide-react";
import type { Masterclass, Lesson } from "@/lib/curriculum";
import { isUnlocked } from "@/lib/curriculum";

type Props = {
  masterclass: Masterclass | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayLesson: (lessonId: string) => void;
  onLaunchLab?: (labType: string) => void;
  completedLessons: string[];
  allLessons: Lesson[];
  isSaved?: boolean;
  onToggleSaved?: (id: string) => void;
};

export default function ClassDetailModal({
  masterclass,
  isOpen,
  onClose,
  onPlayLesson,
  onLaunchLab,
  completedLessons,
  allLessons,
  isSaved,
  onToggleSaved,
}: Props) {
  if (!isOpen || !masterclass) return null;

  // Filter lessons belonging to this masterclass path
  const pathLessons = allLessons.filter(l => l.pathId === masterclass.pathId);
  const completedCount = pathLessons.filter(l => completedLessons.includes(l.id)).length;
  const progressPercent = pathLessons.length > 0 ? Math.round((completedCount / pathLessons.length) * 100) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="netflix-detail-modal" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-round" onClick={onClose} aria-label="Close Preview">
          <X size={20} />
        </button>

        {/* Hero Cinematic Header Banner */}
        <div className="modal-cinematic-hero">
          <div className="hero-dark-vignette" />
          <div className="hero-ambient-lights" />

          {/* Badges and Tags */}
          <div className="modal-hero-content">
            <div className="modal-hero-badges">
              <span className="n-original-badge">ATLAS ACADEMY ORIGINAL</span>
              <span className="n-season-badge">{masterclass.seasonTag}</span>
              <span className="n-match-badge">{masterclass.matchScore}% Match</span>
            </div>

            <h2 className="modal-hero-title">{masterclass.title}</h2>
            <p className="modal-hero-tagline">{masterclass.tagline}</p>

            {/* Play Masterclass CTA Group */}
            <div className="modal-cta-row">
              <button
                onClick={() => onPlayLesson(masterclass.firstLessonId)}
                className="modal-btn-play-primary"
              >
                <Play size={18} fill="currentColor" />
                <span>{completedCount > 0 ? "Resume Learning" : "Start Masterclass"}</span>
              </button>

              {onToggleSaved && (
                <button
                  onClick={() => onToggleSaved(masterclass.id)}
                  className={`modal-btn-action ${isSaved ? "saved" : ""}`}
                  title={isSaved ? "Saved to My List" : "Add to My List"}
                >
                  {isSaved ? <Check size={18} /> : <Plus size={18} />}
                  <span>{isSaved ? "In My List" : "Add to List"}</span>
                </button>
              )}

              {masterclass.interactiveLabType && onLaunchLab && (
                <button
                  onClick={() => onLaunchLab(masterclass.interactiveLabType!)}
                  className="modal-btn-lab"
                >
                  <Cpu size={16} />
                  <span>
                    {masterclass.interactiveLabType === "trading-lab" && "Launch Replay Lab"}
                    {masterclass.interactiveLabType === "risk-lab" && "Launch Risk Lab"}
                    {masterclass.interactiveLabType === "binary-lab" && "Launch Binary Lab"}
                    {masterclass.interactiveLabType === "revision" && "Launch Revision Queue"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body: Details + Episode Guide */}
        <div className="modal-detail-body">
          <div className="modal-body-grid">
            {/* Left Column: Synopsis, Key Outcomes & Instructor */}
            <div className="modal-left-col">
              <div className="modal-meta-specs">
                <span className="spec-item"><Star size={14} fill="#ffd43b" color="#ffd43b" /> <strong>{masterclass.rating}</strong> Rating</span>
                <span className="spec-item"><Clock size={14} /> {masterclass.durationTotal}</span>
                <span className="spec-pill">{masterclass.level} Level</span>
                <span className="spec-quality">{masterclass.qualityBadge}</span>
              </div>

              <div className="modal-synopsis-section">
                <h3>About This Masterclass</h3>
                <p>{masterclass.synopsis}</p>
              </div>

              {/* Key Outcomes Checklist */}
              <div className="modal-outcomes-box">
                <h4>What You Will Demonstrate:</h4>
                <div className="outcomes-list">
                  {masterclass.keyOutcomes.map((outcome, idx) => (
                    <div key={idx} className="outcome-item">
                      <CheckCircle2 size={16} className="outcome-check" />
                      <span>{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructor Card */}
              <div className="modal-instructor-card">
                <div className="inst-avatar">
                  {masterclass.instructor.avatarInitials}
                </div>
                <div>
                  <span className="inst-label">COURSE INSTRUCTOR</span>
                  <h5>{masterclass.instructor.name}</h5>
                  <p>{masterclass.instructor.role}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Episode Guide */}
            <div className="modal-right-col">
              <div className="episodes-header">
                <div>
                  <span className="episodes-kicker">CURRICULUM EPISODES</span>
                  <h3>Episodes ({pathLessons.length})</h3>
                </div>
                {progressPercent > 0 && (
                  <span className="episodes-progress-badge">{progressPercent}% Mastered</span>
                )}
              </div>

              <div className="episodes-scroll-list">
                {pathLessons.map((lesson, idx) => {
                  const isDone = completedLessons.includes(lesson.id);
                  const unlocked = isUnlocked(lesson, completedLessons);

                  return (
                    <div
                      key={lesson.id}
                      className={`episode-card ${!unlocked ? "locked" : ""} ${isDone ? "completed" : ""}`}
                      onClick={() => unlocked && onPlayLesson(lesson.id)}
                    >
                      <div className="episode-num-badge">
                        {isDone ? (
                          <CheckCircle2 size={18} className="ep-done-icon" />
                        ) : unlocked ? (
                          <span>{String(idx + 1).padStart(2, "0")}</span>
                        ) : (
                          <LockKeyhole size={16} className="ep-lock-icon" />
                        )}
                      </div>

                      <div className="episode-content">
                        <div className="ep-title-row">
                          <h4>{lesson.title}</h4>
                          <span className="ep-time">{lesson.duration}m</span>
                        </div>
                        <p className="ep-desc">{lesson.description}</p>
                      </div>

                      {unlocked && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayLesson(lesson.id);
                          }}
                          className="ep-play-btn"
                          aria-label={`Play ${lesson.title}`}
                        >
                          <Play size={14} fill="currentColor" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
