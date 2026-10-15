"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  CheckCircle2,
  LockKeyhole,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Sparkles,
  ShieldCheck,
  Clock,
  Layers,
  Award,
  BookOpen,
  Check,
  TrendingUp,
  Maximize2,
  Zap,
  HelpCircle,
  Flame,
  ArrowRight
} from "lucide-react";
import type { Lesson } from "@/lib/curriculum";
import { isUnlocked } from "@/lib/curriculum";

type Props = {
  lesson: Lesson;
  allLessons: Lesson[];
  completedLessons: string[];
  onCompleteLesson: (lessonId: string, answerIdx: number) => Promise<boolean>;
  onSelectLesson: (lessonId: string) => void;
  onBackToClasses: () => void;
  userXp?: number;
};

// Simulated Interactive Candlestick Scenario Data for Lesson Chart
const SAMPLE_CANDLE_DATA = [
  { time: "09:00", open: 1.0820, high: 1.0838, low: 1.0815, close: 1.0835, isTarget: false },
  { time: "09:15", open: 1.0835, high: 1.0850, low: 1.0830, close: 1.0848, isTarget: false },
  { time: "09:30", open: 1.0848, high: 1.0872, low: 1.0842, close: 1.0868, isTarget: false },
  { time: "09:45", open: 1.0868, high: 1.0870, low: 1.0850, close: 1.0854, isTarget: false },
  { time: "10:00", open: 1.0854, high: 1.0865, low: 1.0830, close: 1.0835, isTarget: false },
  { time: "10:15", open: 1.0835, high: 1.0840, low: 1.0810, close: 1.0815, isTarget: false },
  { time: "10:30", open: 1.0815, high: 1.0855, low: 1.0812, close: 1.0850, isTarget: true, annotation: "Bullish Pinbar Rejection" },
  { time: "10:45", open: 1.0850, high: 1.0875, low: 1.0845, close: 1.0870, isTarget: false },
  { time: "11:00", open: 1.0870, high: 1.0892, low: 1.0865, close: 1.0888, isTarget: false },
  { time: "11:15", open: 1.0888, high: 1.0910, low: 1.0880, close: 1.0905, isTarget: false },
];

export default function InteractiveLessonPlayer({
  lesson,
  allLessons,
  completedLessons,
  onCompleteLesson,
  onSelectLesson,
  onBackToClasses,
}: Props) {
  // Episode Series Context
  const pathLessons = allLessons.filter(l => l.pathId === lesson.pathId);
  const currentEpisodeIndex = pathLessons.findIndex(l => l.id === lesson.id);
  const prevLesson = currentEpisodeIndex > 0 ? pathLessons[currentEpisodeIndex - 1] : null;
  const nextLesson = currentEpisodeIndex < pathLessons.length - 1 ? pathLessons[currentEpisodeIndex + 1] : null;

  // Quiz State
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showXpCelebration, setShowXpCelebration] = useState(false);

  // Interactive Chart Scenario State
  const [selectedCandleIdx, setSelectedCandleIdx] = useState<number>(6); // Focus on key pinbar
  const [chartTimeframe, setChartTimeframe] = useState<"5M" | "15M" | "1H" | "1D">("15M");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio Narrator Simulation State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0); // 0 to 100
  const [audioSpeed, setAudioSpeed] = useState<1 | 1.25 | 1.5>(1);

  // Audio Playback Timer
  useEffect(() => {
    let timer: any;
    if (isPlayingAudio) {
      timer = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1.2 * audioSpeed;
        });
      }, 300);
    }
    return () => clearInterval(timer);
  }, [isPlayingAudio, audioSpeed]);

  // Reset quiz state when switching lesson
  useEffect(() => {
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setIsCorrect(false);
    setIsPlayingAudio(false);
    setAudioProgress(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [lesson.id]);

  // Draw Interactive Lesson Scenario Chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const minP = 1.0805;
    const maxP = 1.0920;
    const range = maxP - minP;

    const getY = (p: number) => height - ((p - minP) / range) * (height - 30) - 15;
    const candleWidth = (width - 60) / SAMPLE_CANDLE_DATA.length;

    // Grid lines
    ctx.strokeStyle = "#1a3a33";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let i = 0; i <= 4; i++) {
      const p = minP + (range * i) / 4;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 55, y);
      ctx.stroke();

      ctx.fillStyle = "#779688";
      ctx.font = "9px monospace";
      ctx.fillText(p.toFixed(4), width - 50, y + 3);
    }
    ctx.setLineDash([]);

    // Draw Candles
    SAMPLE_CANDLE_DATA.forEach((c, idx) => {
      const x = idx * candleWidth + candleWidth / 2;
      const isBull = c.close >= c.open;
      const color = isBull ? "#69db7c" : "#ff6b6b";
      const isSelected = selectedCandleIdx === idx;

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, getY(c.high));
      ctx.lineTo(x, getY(c.low));
      ctx.stroke();

      // Body
      const topY = getY(Math.max(c.open, c.close));
      const botY = getY(Math.min(c.open, c.close));
      const bodyH = Math.max(2, botY - topY);

      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth * 0.32, topY, candleWidth * 0.64, bodyH);

      // Selected Candle Highlight Halo
      if (isSelected) {
        ctx.strokeStyle = "#ffd43b";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - candleWidth * 0.45, topY - 6, candleWidth * 0.9, bodyH + 12);

        // Annotation Pin
        if (c.annotation) {
          ctx.fillStyle = "#ffd43b";
          ctx.font = "10px sans-serif";
          ctx.fillText(`📍 ${c.annotation}`, Math.max(10, x - 50), getY(c.high) - 10);
        }
      }
    });
  }, [selectedCandleIdx, chartTimeframe]);

  // Handle Assessment Quiz Submit
  async function handleQuizSubmit() {
    if (selectedAnswer === null || isSubmitting) return;
    setIsSubmitting(true);
    const passed = await onCompleteLesson(lesson.id, selectedAnswer);
    setIsCorrect(passed);
    setQuizSubmitted(true);
    if (passed) {
      setShowXpCelebration(true);
      setTimeout(() => setShowXpCelebration(false), 3500);
    }
    setIsSubmitting(false);
  }

  const focusedCandle = SAMPLE_CANDLE_DATA[selectedCandleIdx] || SAMPLE_CANDLE_DATA[6];

  return (
    <div className="interactive-player-layout">
      {/* Top Cinema Bar: Breadcrumb + Episode Stepper */}
      <div className="player-topbar-card">
        <div className="player-topbar-left">
          <button onClick={onBackToClasses} className="btn-back-classes">
            <ChevronLeft size={16} /> All Masterclasses
          </button>
          <span className="player-pipe">|</span>
          <span className="player-series-tag">{lesson.category}</span>
          <span className="player-episode-tag">
            Episode {currentEpisodeIndex + 1} of {pathLessons.length}
          </span>
        </div>

        <div className="player-topbar-right">
          {prevLesson && isUnlocked(prevLesson, completedLessons) && (
            <button onClick={() => onSelectLesson(prevLesson.id)} className="btn-ep-nav">
              <ChevronLeft size={14} /> Prev Ep
            </button>
          )}

          {nextLesson && isUnlocked(nextLesson, completedLessons) && (
            <button onClick={() => onSelectLesson(nextLesson.id)} className="btn-ep-nav next">
              Next Ep <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Lesson Stage */}
      <div className="player-stage-grid">
        {/* Left Column: Interactive Scenario & Educational Article */}
        <div className="player-main-column">
          {/* Episode Header */}
          <div className="episode-headline-card">
            <div className="ep-kicker-row">
              <span className="ep-kicker-pill">{lesson.level.toUpperCase()} LEVEL</span>
              <span className="ep-kicker-time"><Clock size={13} /> {lesson.duration} Mins</span>
              <span className="ep-kicker-spec"><ShieldCheck size={13} /> Educational Virtual Workspace</span>
            </div>

            <h1 className="ep-main-title">{lesson.title}</h1>
            <p className="ep-lead-summary">{lesson.description}</p>

            {/* Audio Narrator Bar */}
            <div className="audio-narrator-bar">
              <button
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className={`narrator-play-btn ${isPlayingAudio ? "playing" : ""}`}
                aria-label={isPlayingAudio ? "Pause Audio" : "Play Audio"}
              >
                {isPlayingAudio ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
              </button>

              <div className="narrator-track">
                <div className="narrator-label-row">
                  <span className="narrator-label">
                    <Volume2 size={13} /> Audio Masterclass Narration
                  </span>
                  <span className="narrator-time">{Math.round(audioProgress)}%</span>
                </div>
                <div className="narrator-progress-line">
                  <div style={{ width: `${audioProgress}%` }} />
                </div>
              </div>

              {/* Speed multiplier */}
              <button
                onClick={() => setAudioSpeed(s => (s === 1 ? 1.25 : s === 1.25 ? 1.5 : 1))}
                className="narrator-speed-btn"
              >
                {audioSpeed}x
              </button>
            </div>
          </div>

          {/* Interactive Chart Scenario Sandbox */}
          <div className="interactive-chart-sandbox">
            <div className="sandbox-header">
              <div className="sandbox-title">
                <Sparkles size={16} />
                <span>Interactive Chart Concept: Inspect Price Action</span>
              </div>

              <div className="sandbox-timeframes">
                {(["5M", "15M", "1H", "1D"] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`tf-pill ${chartTimeframe === tf ? "active" : ""}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas */}
            <div className="sandbox-canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={820}
                height={260}
                className="sandbox-canvas"
              />
            </div>

            {/* Candle Inspector HUD */}
            <div className="candle-inspector-hud">
              <div className="inspector-cell">
                <span>Time:</span> <strong>{focusedCandle.time}</strong>
              </div>
              <div className="inspector-cell">
                <span>Open:</span> <strong>{focusedCandle.open.toFixed(4)}</strong>
              </div>
              <div className="inspector-cell">
                <span>High:</span> <strong>{focusedCandle.high.toFixed(4)}</strong>
              </div>
              <div className="inspector-cell">
                <span>Low:</span> <strong>{focusedCandle.low.toFixed(4)}</strong>
              </div>
              <div className="inspector-cell">
                <span>Close:</span> <strong>{focusedCandle.close.toFixed(4)}</strong>
              </div>
              <div className="inspector-actions">
                <button
                  onClick={() => setSelectedCandleIdx(prev => (prev > 0 ? prev - 1 : SAMPLE_CANDLE_DATA.length - 1))}
                  className="btn-step-bar"
                >
                  ◀ Prev Bar
                </button>
                <button
                  onClick={() => setSelectedCandleIdx(prev => (prev < SAMPLE_CANDLE_DATA.length - 1 ? prev + 1 : 0))}
                  className="btn-step-bar"
                >
                  Next Bar ▶
                </button>
              </div>
            </div>
          </div>

          {/* Lesson Article Text Body */}
          <article className="episode-article-body">
            {lesson.content.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </article>

          {/* Key Takeaway Callout Box */}
          <div className="masterclass-takeaway-card">
            <div className="takeaway-icon-circle">
              <Lightbulb size={22} />
            </div>
            <div>
              <strong>Key Principle:</strong>
              <p>{lesson.takeaway}</p>
            </div>
          </div>

          {/* Verification Assessment Quiz Box */}
          <div className="verification-quiz-card">
            <div className="quiz-card-head">
              <span className="quiz-kicker">DEMONSTRATED MASTERY CHECK</span>
              <h2>Put It Into Practice</h2>
              <p>Answer correctly to verify your understanding, earn XP, and unlock the next episode.</p>
            </div>

            <h3 className="quiz-question-text">{lesson.question}</h3>

            <div className="quiz-options-list">
              {lesson.options.map((option, idx) => (
                <button
                  key={idx}
                  disabled={quizSubmitted && isCorrect}
                  onClick={() => setSelectedAnswer(idx)}
                  className={`quiz-option-button ${
                    selectedAnswer === idx ? "selected" : ""
                  } ${
                    quizSubmitted && idx === lesson.answer ? "correct-answer" : ""
                  } ${
                    quizSubmitted && selectedAnswer === idx && !isCorrect ? "wrong-answer" : ""
                  }`}
                >
                  <span className="option-badge">{String.fromCharCode(65 + idx)}</span>
                  <span className="option-title">{option}</span>
                  {selectedAnswer === idx && <Check size={18} className="option-check" />}
                </button>
              ))}
            </div>

            {/* Quiz Result Banner */}
            {quizSubmitted ? (
              <div className={`quiz-feedback-box ${isCorrect ? "feedback-pass" : "feedback-fail"}`}>
                <div className="feedback-title">
                  {isCorrect ? <CheckCircle2 size={20} /> : <RotateCcw size={20} />}
                  <strong>{isCorrect ? "Mastery Demonstrated! (+50 XP)" : "Review & Try Again"}</strong>
                </div>
                <p>{lesson.explanation}</p>

                {isCorrect ? (
                  <div className="feedback-cta-row">
                    {nextLesson ? (
                      <button onClick={() => onSelectLesson(nextLesson.id)} className="btn-next-episode">
                        Continue to Next Episode <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button onClick={onBackToClasses} className="btn-next-episode">
                        Masterclass Series Completed! Return to Portal <Check size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setQuizSubmitted(false);
                      setSelectedAnswer(null);
                    }}
                    className="btn-retry-quiz"
                  >
                    Try Question Again <RotateCcw size={14} />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleQuizSubmit}
                disabled={selectedAnswer === null || isSubmitting}
                className="btn-verify-quiz-action"
              >
                {isSubmitting ? "Verifying Answer..." : "Verify Understanding"}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Episode Rail & Series Progress */}
        <aside className="player-sidebar-column">
          <div className="series-episodes-card">
            <span className="series-kicker">EPISODE GUIDE</span>
            <h3>{lesson.category}</h3>

            <div className="series-episodes-scroll">
              {pathLessons.map((item, idx) => {
                const isCurrent = item.id === lesson.id;
                const isDone = completedLessons.includes(item.id);
                const unlocked = isUnlocked(item, completedLessons);

                return (
                  <button
                    key={item.id}
                    disabled={!unlocked}
                    onClick={() => onSelectLesson(item.id)}
                    className={`rail-episode-row ${isCurrent ? "active-ep" : ""} ${!unlocked ? "locked-ep" : ""}`}
                  >
                    <div className="rail-num">
                      {isDone ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : unlocked ? (
                        <span>{String(idx + 1).padStart(2, "0")}</span>
                      ) : (
                        <LockKeyhole size={14} />
                      )}
                    </div>

                    <div className="rail-info">
                      <h4>{item.title}</h4>
                      <span>{item.duration} Mins</span>
                    </div>

                    {isCurrent && <span className="now-playing-pill">PLAYING</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Floating XP Celebration Banner */}
      {showXpCelebration && (
        <div className="xp-celebration-toast">
          <Sparkles size={22} className="xp-sparkle-icon" />
          <div>
            <strong>+50 Experience Points!</strong>
            <span>Skill Mastery verified in database.</span>
          </div>
        </div>
      )}
    </div>
  );
}
