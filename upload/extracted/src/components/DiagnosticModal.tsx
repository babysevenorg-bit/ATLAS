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
  X
} from "lucide-react";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/curriculum";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (assignedLevel: string, categoryScores: Record<string, number>) => void;
};

export default function DiagnosticModal({ isOpen, onClose, onCompleted }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [currentChoice, setCurrentChoice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    percent: number;
    assignedLevel: string;
    categoryScores: Record<string, number>;
  } | null>(null);

  if (!isOpen) return null;

  const currentQ = DIAGNOSTIC_QUESTIONS[currentIndex];

  function handleNext() {
    if (currentChoice === null) return;
    const updated = [...selectedAnswers, currentChoice];
    setSelectedAnswers(updated);
    setCurrentChoice(null);

    if (currentIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Complete! Submit diagnostic
      submitDiagnostic(updated);
    }
  }

  async function submitDiagnostic(finalAnswers: number[]) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data);
        onCompleted(data.assignedLevel, data.categoryScores);
      }
    } catch {}
    setSubmitting(false);
  }

  function restart() {
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setCurrentChoice(null);
    setResults(null);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="diagnostic-modal-card" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn" aria-label="Close">
          <X size={20} />
        </button>

        {!results ? (
          <div>
            <div className="diag-header">
              <div className="diag-icon">
                <Compass size={24} />
              </div>
              <div>
                <span className="diag-kicker">ADAPTIVE PLACEMENT ENGINE</span>
                <h2>Diagnostic Assessment</h2>
                <p>
                  Question {currentIndex + 1} of {DIAGNOSTIC_QUESTIONS.length} · {currentQ.category}
                </p>
              </div>
            </div>

            {/* Progress track */}
            <div className="diag-progress-bar">
              <div
                style={{
                  width: `${((currentIndex + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%`
                }}
              />
            </div>

            {/* Question Card */}
            <div className="diag-question-box">
              <h3>{currentQ.question}</h3>
              <div className="diag-options-list">
                {currentQ.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentChoice(idx)}
                    className={`diag-option-btn ${currentChoice === idx ? "selected" : ""}`}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="option-text">{option}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="diag-footer">
              <span className="diag-note">
                <ShieldCheck size={15} /> Your responses determine your initial unlocked modules.
              </span>
              <button
                onClick={handleNext}
                disabled={currentChoice === null || submitting}
                className="diag-next-btn"
              >
                {currentIndex < DIAGNOSTIC_QUESTIONS.length - 1 ? (
                  <>Continue <ArrowRight size={16} /></>
                ) : (
                  <>{submitting ? "Evaluating..." : "Complete Assessment"} <Sparkles size={16} /></>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Results Evaluation Screen */
          <div className="diag-results-layout">
            <div className="results-badge">
              <Award size={28} />
            </div>
            <span className="diag-kicker">ASSESSMENT COMPLETE</span>
            <h2>Your Learning Profile: Persona {results.assignedLevel === "Beginner" ? "A" : results.assignedLevel === "Developing" ? "B" : "C"}</h2>
            <p className="results-subtitle">
              You scored <strong>{results.score} of {results.total} ({results.percent}%)</strong>. We have tailored your academy learning dashboard accordingly.
            </p>

            <div className="persona-highlight-box">
              <h4>
                {results.assignedLevel === "Beginner" && "Persona A: Complete Beginner"}
                {results.assignedLevel === "Developing" && "Persona B: Developing Learner"}
                {results.assignedLevel === "Advanced" && "Persona C: Advanced Practitioner"}
              </h4>
              <p>
                {results.assignedLevel === "Beginner" && "We recommend starting from Chapter 01 (Forex Foundations) to solidify quote conventions, pip calculations, and risk discipline."}
                {results.assignedLevel === "Developing" && "You demonstrated good foundational literacy! We have unlocked intermediate technical analysis and risk management simulation labs."}
                {results.assignedLevel === "Advanced" && "Outstanding mastery! You have unlocked all foundational modules and can immediately engage in historical market replay and drawdown testing."}
              </p>
            </div>

            {/* Category Scores */}
            <div className="category-scores-grid">
              {Object.entries(results.categoryScores).map(([cat, score]) => (
                <div key={cat} className="cat-score-row">
                  <div className="cat-label">
                    <span>{cat}</span>
                    <strong>{score}%</strong>
                  </div>
                  <div className="cat-bar">
                    <div style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="results-actions">
              <button onClick={restart} className="diag-restart-btn">
                <RotateCcw size={15} /> Retake Diagnostic
              </button>
              <button onClick={onClose} className="diag-finish-btn">
                Go to Tailored Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
