"use client";

import React from "react";
import {
  Compass,
  Rocket,
  BookOpen,
  ShieldCheck,
  Check,
  ArrowRight,
  Target,
  Brain,
  Award,
} from "lucide-react";

type Props = {
  hasCompletedOnboarding: boolean;
  hasTakenDiagnostic: boolean;
  completedLessonsCount: number;
  onTakeDiagnostic: () => void;
  onCompleteOnboarding: () => void;
  onStartFirstLesson: () => void;
  onVisitRiskLab: () => void;
};

type Step = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  action: () => void;
  actionLabel: string;
  done: boolean;
  duration: string;
};

export default function NextStepsPanel({
  hasCompletedOnboarding,
  hasTakenDiagnostic,
  completedLessonsCount,
  onTakeDiagnostic,
  onCompleteOnboarding,
  onStartFirstLesson,
  onVisitRiskLab,
}: Props) {
  const steps: Step[] = [
    {
      id: "diagnostic",
      title: "Take the Diagnostic Test",
      description: "A 10-question placement test that finds your starting level. Takes 2 minutes. Score Advanced to skip beginner lessons.",
      icon: Compass,
      action: onTakeDiagnostic,
      actionLabel: hasTakenDiagnostic ? "Retake Diagnostic" : "Take Diagnostic",
      done: hasTakenDiagnostic,
      duration: "2 min",
    },
    {
      id: "onboarding",
      title: "Complete Adaptive Onboarding",
      description: "Tell us your goal, daily time budget, and learning style. We'll tailor your curriculum sequence.",
      icon: Rocket,
      action: onCompleteOnboarding,
      actionLabel: hasCompletedOnboarding ? "Update Profile" : "Start Onboarding",
      done: hasCompletedOnboarding,
      duration: "2 min",
    },
    {
      id: "first-lesson",
      title: "Start Your First Lesson",
      description: "Begin with \"What is the Forex Market?\" — read the content, then pass the quiz to unlock the next lesson and earn 50 XP.",
      icon: BookOpen,
      action: onStartFirstLesson,
      actionLabel: completedLessonsCount > 0 ? "Continue Learning" : "Start First Lesson",
      done: completedLessonsCount > 0,
      duration: "8 min",
    },
    {
      id: "risk-lab",
      title: "Visit the Risk Laboratory",
      description: "Explore 7 interactive calculators: position sizing, leverage & margin, drawdown curve, correlation risk, and more.",
      icon: ShieldCheck,
      action: onVisitRiskLab,
      actionLabel: "Open Risk Lab",
      done: false, // never marked done — always available
      duration: "Explore",
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length - 1; // -1 because risk-lab is always available

  return (
    <div className="next-steps-panel">
      <div className="next-steps-header">
        <div>
          <div className="next-steps-eyebrow">
            <Target size={12} /> YOUR LEARNING JOURNEY
          </div>
          <h3>{allDone ? "You're all set!" : "Here's what to do next"}</h3>
          <p>
            {allDone
              ? "You've completed the onboarding flow. Continue exploring the platform — new lessons and achievements await."
              : `Complete these ${steps.length - completedCount} steps to set up your personalized learning path.`}
          </p>
        </div>
        <div className="next-steps-progress-ring">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#234b43" strokeWidth="4" />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="#c9ed85"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(completedCount / steps.length) * 150.8} 150.8`}
              transform="rotate(-90 28 28)"
            />
            <text x="28" y="32" textAnchor="middle" fontSize="13" fontWeight="700" fill="white" fontFamily="Manrope, sans-serif">
              {completedCount}/{steps.length}
            </text>
          </svg>
        </div>
      </div>

      <div className="next-steps-list">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = !step.done && steps.slice(0, idx).every(s => s.done);
          return (
            <div
              key={step.id}
              className={`next-step-row ${step.done ? "done" : isCurrent ? "current" : ""}`}
            >
              <div className={`next-step-marker ${step.done ? "done" : isCurrent ? "current" : ""}`}>
                {step.done ? (
                  <Check size={16} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <div className="next-step-icon">
                <Icon size={18} />
              </div>
              <div className="next-step-body">
                <div className="next-step-title-row">
                  <strong>{step.title}</strong>
                  <span className="next-step-duration">{step.duration}</span>
                </div>
                <p>{step.description}</p>
              </div>
              <button
                className={`next-step-cta ${step.done ? "done" : isCurrent ? "primary" : ""}`}
                onClick={step.action}
                disabled={false}
              >
                {step.done ? (
                  <>
                    <Check size={14} /> Done
                  </>
                ) : (
                  <>
                    {step.actionLabel} <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick exploration shortcuts */}
      <div className="next-steps-shortcuts">
        <span className="shortcuts-label">QUICK EXPLORE</span>
        <div className="shortcuts-row">
          <button className="shortcut-chip" onClick={onVisitRiskLab}>
            <ShieldCheck size={14} /> Risk Lab
          </button>
          <button className="shortcut-chip" onClick={onStartFirstLesson}>
            <BookOpen size={14} /> Browse Academy
          </button>
          <button className="shortcut-chip" onClick={() => window.location.href = "/workspace/skill-universe"}>
            <Target size={14} /> 3D Skill Map
          </button>
          <button className="shortcut-chip" onClick={() => window.location.href = "/workspace/achievements"}>
            <Award size={14} /> Achievements
          </button>
          <button className="shortcut-chip" onClick={() => window.location.href = "/workspace/coach"}>
            <Brain size={14} /> AI Coach
          </button>
        </div>
      </div>
    </div>
  );
}
