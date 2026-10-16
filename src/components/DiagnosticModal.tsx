"use client";

import React, { useState } from "react";
import {
  Compass,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Award,
  Layers,
  HelpCircle,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/curriculum";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (assignedLevel: string, categoryScores: Record<string, number>) => void;
};

type Results = {
  score: number;
  total: number;
  percent: number;
  assignedLevel: string;
  categoryScores: Record<string, number>;
};

export default function DiagnosticModal({ isOpen, onClose, onCompleted }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [currentChoice, setCurrentChoice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);

  if (!isOpen) return null;

  const currentQ = DIAGNOSTIC_QUESTIONS[currentIndex];
  const isLastQuestion = currentIndex === DIAGNOSTIC_QUESTIONS.length - 1;

  function handleNext() {
    if (currentChoice === null) return;
    setError(null);
    const updated = [...selectedAnswers, currentChoice];
    setSelectedAnswers(updated);
    setCurrentChoice(null);

    if (currentIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      submitDiagnostic(updated);
    }
  }

  function handleBack() {
    if (currentIndex === 0) return;
    setError(null);
    // Restore the previous answer
    const prevAnswers = [...selectedAnswers];
    const prevAnswer = prevAnswers.pop();
    setSelectedAnswers(prevAnswers);
    if (prevAnswer !== undefined) setCurrentChoice(prevAnswer);
    setCurrentIndex(prev => prev - 1);
  }

  async function submitDiagnostic(finalAnswers: number[]) {
    setSubmitting(true);
    setError(null);

    // Compute results locally first (works for both guests and authenticated users)
    let score = 0;
    const categoryScores: Record<string, { correct: number; total: number }> = {};
    DIAGNOSTIC_QUESTIONS.forEach((q, index) => {
      const userAns = finalAnswers[index];
      const isCorrect = userAns === q.answer;
      if (isCorrect) score += 1;
      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { correct: 0, total: 0 };
      }
      categoryScores[q.category].total += 1;
      if (isCorrect) categoryScores[q.category].correct += 1;
    });

    const percent = Math.round((score / DIAGNOSTIC_QUESTIONS.length) * 100);
    let assignedLevel: string = "Beginner";
    if (percent >= 80) assignedLevel = "Advanced";
    else if (percent >= 50) assignedLevel = "Developing";

    const categoryPercents: Record<string, number> = {};
    for (const [cat, data] of Object.entries(categoryScores)) {
      categoryPercents[cat] = Math.round((data.correct / data.total) * 100);
    }

    const localResults: Results = {
      score,
      total: DIAGNOSTIC_QUESTIONS.length,
      percent,
      assignedLevel,
      categoryScores: categoryPercents,
    };

    // Try to persist to the server (if authenticated). If it fails, use local results anyway.
    try {
      const res = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        onCompleted(data.assignedLevel, data.categoryScores);
      } else {
        // API failed (maybe not authenticated, or DB error) — use local results
        setResults(localResults);
        onCompleted(assignedLevel, categoryPercents);
      }
    } catch {
      // Network error — use local results
      setResults(localResults);
      onCompleted(assignedLevel, categoryPercents);
    }
    setSubmitting(false);
  }

  function restart() {
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setCurrentChoice(null);
    setResults(null);
    setError(null);
  }

  function handleClose() {
    restart();
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="diagnostic-modal" onClick={e => e.stopPropagation()}>
        {/* Close button — always visible */}
        <button className="diagnostic-close-btn" onClick={handleClose} title="Close">
          <X size={20} />
        </button>

        {!results ? (
          <>
            {/* Header */}
            <div className="diagnostic-header">
              <div className="diagnostic-badge">
                <Compass size={14} /> ADAPTIVE PLACEMENT ENGINE
              </div>
              <h2>Diagnostic Assessment</h2>
              <p>Question {currentIndex + 1} of {DIAGNOSTIC_QUESTIONS.length} · {currentQ.category}</p>
              {/* Progress bar */}
              <div className="diagnostic-progress-bar">
                <div
                  className="diagnostic-progress-fill"
                  style={{ width: `${((currentIndex + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="diagnostic-question-body">
              <h3>{currentQ.question}</h3>
              <div className="diagnostic-choices">
                {currentQ.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentChoice(idx)}
                    className={`diagnostic-choice ${currentChoice === idx ? "selected" : ""}`}
                  >
                    <span className="choice-letter">{String.fromCharCode(65 + idx)}</span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="diagnostic-error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="diagnostic-actions">
              <button
                onClick={handleBack}
                disabled={currentIndex === 0 || submitting}
                className="diagnostic-btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={currentChoice === null || submitting}
                className="diagnostic-btn-primary"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Evaluating...
                  </>
                ) : isLastQuestion ? (
                  <>
                    Submit & See Results <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    Continue <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Results screen */}
            <div className="diagnostic-results-header">
              <div className={`diagnostic-level-badge ${results.assignedLevel.toLowerCase()}`}>
                <Award size={20} />
                <span>{results.assignedLevel}</span>
              </div>
              <h2>Diagnostic Complete!</h2>
              <p>You scored {results.score} / {results.total} ({results.percent}%)</p>
            </div>

            <div className="diagnostic-results-body">
              <div className="diagnostic-score-ring">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e3ebe0" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={results.percent >= 80 ? "#5fbf6f" : results.percent >= 50 ? "#ffd43b" : "#ff8787"}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(results.percent / 100) * 314.2} 314.2`}
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="58" textAnchor="middle" fontSize="24" fontWeight="700" fill="#163832" fontFamily="Manrope, sans-serif">
                    {results.percent}%
                  </text>
                  <text x="60" y="76" textAnchor="middle" fontSize="10" fill="#7c8b86" fontFamily="DM Sans, sans-serif">
                    {results.score}/{results.total}
                  </text>
                </svg>
              </div>

              <div className="diagnostic-category-scores">
                <h4>Category Breakdown</h4>
                {Object.entries(results.categoryScores).map(([cat, pct]) => (
                  <div key={cat} className="diagnostic-category-row">
                    <span>{cat}</span>
                    <div className="diagnostic-category-bar">
                      <div
                        className="diagnostic-category-fill"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? "#5fbf6f" : pct >= 50 ? "#ffd43b" : "#ff8787",
                        }}
                      />
                    </div>
                    <strong>{pct}%</strong>
                  </div>
                ))}
              </div>

              <div className="diagnostic-next-steps">
                <Sparkles size={16} />
                <div>
                  <strong>What happens next?</strong>
                  <p>
                    {results.assignedLevel === "Advanced"
                      ? "You've been placed ahead! Some beginner lessons are auto-unlocked. Start with the next available lesson in your path."
                      : results.assignedLevel === "Developing"
                      ? "You have a solid foundation. Review any gaps in the category breakdown above, then continue with the next lesson."
                      : "Welcome! Start with the first lesson in Forex Foundations — you'll build each skill step by step."}
                  </p>
                </div>
              </div>
            </div>

            <div className="diagnostic-results-actions">
              <button onClick={restart} className="diagnostic-btn-secondary">
                <RotateCcw size={14} /> Retake
              </button>
              <button onClick={handleClose} className="diagnostic-btn-primary">
                Continue to Lessons <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
