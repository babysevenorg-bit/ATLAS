"use client";

import React, { useState } from "react";
import {
  Play,
  Info,
  Check,
  Plus,
  Star,
  Sparkles,
  Flame,
  ShieldCheck,
  Clock,
  Layers,
  Award,
  ChevronRight
} from "lucide-react";
import type { Masterclass, Lesson } from "@/lib/curriculum";

type Props = {
  masterclass: Masterclass;
  rankNumber?: number;
  completedLessons: string[];
  allLessons: Lesson[];
  onPlay: (lessonId: string) => void;
  onOpenDetails: (masterclass: Masterclass) => void;
  isSaved?: boolean;
  onToggleSaved?: (id: string) => void;
};

export default function NetflixCard({
  masterclass,
  rankNumber,
  completedLessons,
  allLessons,
  onPlay,
  onOpenDetails,
  isSaved,
  onToggleSaved,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate completion percentage for this class
  const classLessons = allLessons.filter(l => l.pathId === masterclass.pathId);
  const classCompletedCount = classLessons.filter(l => completedLessons.includes(l.id)).length;
  const progressPercent = classLessons.length > 0 ? Math.round((classCompletedCount / classLessons.length) * 100) : 0;

  // Background visual patterns according to category
  const categoryGradients: Record<string, string> = {
    "Forex Foundations": "from-[#08201a] via-[#10382f] to-[#0a1815]",
    "Risk Management": "from-[#091b22] via-[#0f343a] to-[#071318]",
    "Technical Analysis": "from-[#0c1628] via-[#152a4a] to-[#091120]",
    "Binary Options": "from-[#280c14] via-[#48121f] to-[#1a080c]",
    "Trading Psychology": "from-[#1b0d28] via-[#33174d] to-[#12081c]",
  };

  const gradientClass = categoryGradients[masterclass.category] || "from-[#0d221c] via-[#173a30] to-[#0c1a16]";

  return (
    <div
      className={`netflix-card-wrapper ${rankNumber ? "has-rank" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Big 3D Netflix-Style Rank Number for Top 10 */}
      {rankNumber && (
        <div className="netflix-rank-number" aria-hidden="true">
          <span className="rank-stroke">{rankNumber}</span>
          <span className="rank-fill">{rankNumber}</span>
        </div>
      )}

      {/* Main Poster / Card Surface */}
      <div
        className={`netflix-card-body bg-gradient-to-br ${gradientClass}`}
        onClick={() => onOpenDetails(masterclass)}
        role="button"
        tabIndex={0}
      >
        {/* Glow ambient background aura */}
        <div className="card-ambient-glow" />

        {/* Top Badges Header */}
        <div className="card-top-badges">
          {masterclass.badge && (
            <span className={`n-badge ${masterclass.badge.toLowerCase().replace(" ", "-")}`}>
              {masterclass.badge === "TOP 10" && <Flame size={10} />}
              {masterclass.badge === "MUST WATCH" && <Sparkles size={10} />}
              {masterclass.badge}
            </span>
          )}
          <span className="n-quality-pill">{masterclass.qualityBadge}</span>
        </div>

        {/* Center Artwork / Visual Metaphor */}
        <div className="card-center-art">
          <div className="art-candlestick-glow">
            <div className="art-bar bar-1" />
            <div className="art-bar bar-2 up" />
            <div className="art-bar bar-3 up" />
            <div className="art-bar bar-4 down" />
            <div className="art-bar bar-5 up" />
          </div>
          <span className="card-category-kicker">{masterclass.category.toUpperCase()}</span>
        </div>

        {/* Card Content Footer */}
        <div className="card-content-footer">
          <h4 className="card-title">{masterclass.title}</h4>
          <p className="card-tagline">{masterclass.tagline}</p>

          <div className="card-meta-row">
            <span className="match-score">{masterclass.matchScore}% Match</span>
            <span className="meta-pill">{masterclass.level}</span>
            <span className="meta-star"><Star size={11} fill="#ffd43b" color="#ffd43b" /> {masterclass.rating}</span>
            <span className="meta-duration"><Clock size={11} /> {masterclass.episodeCount} Ep</span>
          </div>

          {/* Progress Bar (if in progress) */}
          {progressPercent > 0 && (
            <div className="card-progress-bar">
              <div style={{ width: `${progressPercent}%` }} />
              <span className="progress-label">{progressPercent}% Mastered</span>
            </div>
          )}
        </div>

        {/* Hover Action Overlay Controls */}
        <div className={`card-hover-overlay ${isHovered ? "visible" : ""}`}>
          <div className="overlay-actions-row">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(masterclass.firstLessonId);
              }}
              className="action-btn-play"
              title="Play Masterclass"
              aria-label={`Play ${masterclass.title}`}
            >
              <Play size={16} fill="currentColor" />
            </button>

            {onToggleSaved && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSaved(masterclass.id);
                }}
                className={`action-btn-icon ${isSaved ? "saved" : ""}`}
                title={isSaved ? "Remove from My List" : "Add to My List"}
              >
                {isSaved ? <Check size={16} /> : <Plus size={16} />}
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(masterclass);
              }}
              className="action-btn-icon"
              title="Episodes & Details"
              aria-label="View Details"
            >
              <Info size={16} />
            </button>
          </div>

          <div className="hover-tags-list">
            {masterclass.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="hover-tag-pill">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
