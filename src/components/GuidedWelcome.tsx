"use client";

import React, { useState } from "react";
import {
  Rocket,
  GraduationCap,
  ShieldCheck,
  Brain,
  ArrowRight,
  ArrowLeft,
  Check,
  Compass,
  BookOpen,
  Target,
  Sparkles,
  X,
} from "lucide-react";

type Step = "welcome" | "what-youll-learn" | "your-path" | "next-steps";

type Props = {
  onComplete: () => void;
  onSkip: () => void;
  userName?: string;
};

const STEPS: { id: Step; title: string }[] = [
  { id: "welcome", title: "Welcome" },
  { id: "what-youll-learn", title: "What You'll Learn" },
  { id: "your-path", title: "Your Learning Path" },
  { id: "next-steps", title: "Next Steps" },
];

export default function GuidedWelcome({ onComplete, onSkip, userName }: Props) {
  const [step, setStep] = useState<Step>("welcome");
  const stepIndex = STEPS.findIndex(s => s.id === step);
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100;

  function next() {
    const idx = STEPS.findIndex(s => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
    else onComplete();
  }
  function back() {
    const idx = STEPS.findIndex(s => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  }

  return (
    <div className="guided-welcome-overlay" onClick={onSkip}>
      <div className="guided-welcome-card" onClick={e => e.stopPropagation()}>
        {/* Skip button */}
        <button className="guided-skip-btn" onClick={onSkip} title="Skip tour">
          <X size={16} />
        </button>

        {/* Progress header */}
        <div className="guided-progress-header">
          <div className="guided-progress-bar">
            <div className="guided-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="guided-step-meta">
            <span className="guided-kicker">
              <Rocket size={12} /> ATLAS ONBOARDING · STEP {stepIndex + 1} OF {STEPS.length}
            </span>
            <span className="guided-progress-label">{Math.round(progressPct)}% complete</span>
          </div>
        </div>

        {/* Step content */}
        <div className="guided-step-content">
          {/* STEP 1: WELCOME */}
          {step === "welcome" && (
            <div className="guided-step-body">
              <div className="guided-step-icon">
                <Rocket size={48} />
              </div>
              <h1>Welcome to Atlas Academy{userName ? `, ${userName}` : ""}.</h1>
              <p className="guided-step-lead">
                You're about to learn forex &amp; binary options trading from absolute zero —
                with <strong>virtual money only</strong>, zero real-money risk, and an adaptive
                curriculum that grows with your skills.
              </p>
              <div className="guided-promise-row">
                <div className="guided-promise">
                  <ShieldCheck size={20} />
                  <div>
                    <strong>Strictly Educational</strong>
                    <p>Virtual funds only. Zero real-money execution.</p>
                  </div>
                </div>
                <div className="guided-promise">
                  <Brain size={20} />
                  <div>
                    <strong>Adaptive Learning</strong>
                    <p>Lessons unlock based on your demonstrated mastery.</p>
                  </div>
                </div>
                <div className="guided-promise">
                  <Target size={20} />
                  <div>
                    <strong>Risk-First Training</strong>
                    <p>Master position sizing &amp; drawdown before any trade.</p>
                  </div>
                </div>
              </div>
              <p className="guided-tour-note">
                This 4-step tour takes 60 seconds and shows you exactly how to navigate the platform.
                Let&apos;s begin.
              </p>
            </div>
          )}

          {/* STEP 2: WHAT YOU'LL LEARN */}
          {step === "what-youll-learn" && (
            <div className="guided-step-body">
              <div className="guided-step-icon">
                <GraduationCap size={48} />
              </div>
              <h2>What You&apos;ll Learn</h2>
              <p className="guided-step-lead">
                The curriculum spans five learning paths, each with interactive lessons, quizzes,
                and hands-on simulator practice.
              </p>
              <div className="guided-curriculum-grid">
                <div className="guided-curriculum-tile">
                  <span className="guided-curriculum-num">01</span>
                  <strong>Forex Foundations</strong>
                  <p>Currency pairs, pips, spreads, lot sizes, margin &amp; leverage.</p>
                </div>
                <div className="guided-curriculum-tile">
                  <span className="guided-curriculum-num">02</span>
                  <strong>Technical Analysis</strong>
                  <p>Candlesticks, support/resistance, market structure, indicators.</p>
                </div>
                <div className="guided-curriculum-tile">
                  <span className="guided-curriculum-num">03</span>
                  <strong>Risk Management</strong>
                  <p>Position sizing, drawdown, R:R ratios, risk of ruin.</p>
                </div>
                <div className="guided-curriculum-tile">
                  <span className="guided-curriculum-num">04</span>
                  <strong>Trading Psychology</strong>
                  <p>Process over outcomes, discipline, avoiding tilt &amp; FOMO.</p>
                </div>
                <div className="guided-curriculum-tile">
                  <span className="guided-curriculum-num">05</span>
                  <strong>Binary Options Theory</strong>
                  <p>Expected value, house edge, break-even math (educational only).</p>
                </div>
              </div>
              <p className="guided-tour-note">
                Every lesson has a quiz at the end. Pass the quiz → unlock the next lesson →
                earn XP &amp; achievements.
              </p>
            </div>
          )}

          {/* STEP 3: YOUR LEARNING PATH */}
          {step === "your-path" && (
            <div className="guided-step-body">
              <div className="guided-step-icon">
                <Compass size={48} />
              </div>
              <h2>Your Learning Path</h2>
              <p className="guided-step-lead">
                Here&apos;s the journey we recommend. You can explore freely, but this sequence
                ensures you build each skill on a solid foundation.
              </p>
              <div className="guided-path-timeline">
                <div className="guided-path-stop">
                  <div className="guided-path-marker done">
                    <Check size={14} />
                  </div>
                  <div className="guided-path-content">
                    <span className="guided-path-step-num">STEP 1 · 2 MIN</span>
                    <strong>Take the Diagnostic Test</strong>
                    <p>A 10-question placement test. Score well to skip beginner lessons and start at the right level.</p>
                  </div>
                </div>
                <div className="guided-path-connector" />
                <div className="guided-path-stop">
                  <div className="guided-path-marker">2</div>
                  <div className="guided-path-content">
                    <span className="guided-path-step-num">STEP 2 · 2 MIN</span>
                    <strong>Complete Adaptive Onboarding</strong>
                    <p>Tell us your goal, daily time budget, and learning style. We&apos;ll tailor your curriculum.</p>
                  </div>
                </div>
                <div className="guided-path-connector" />
                <div className="guided-path-stop">
                  <div className="guided-path-marker">3</div>
                  <div className="guided-path-content">
                    <span className="guided-path-step-num">STEP 3 · 8 MIN</span>
                    <strong>Start Your First Lesson</strong>
                    <p>Begin with &quot;What is the Forex Market?&quot; — read, interact, and pass the quiz.</p>
                  </div>
                </div>
                <div className="guided-path-connector" />
                <div className="guided-path-stop">
                  <div className="guided-path-marker">4</div>
                  <div className="guided-path-content">
                    <span className="guided-path-step-num">STEP 4 · ONGOING</span>
                    <strong>Practice in the Simulators</strong>
                    <p>Apply what you learn in the Trading Lab, Risk Laboratory, and Backtest Arena.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: NEXT STEPS — NAVIGATION GUIDE */}
          {step === "next-steps" && (
            <div className="guided-step-body">
              <div className="guided-step-icon">
                <Sparkles size={48} />
              </div>
              <h2>How to Navigate Atlas</h2>
              <p className="guided-step-lead">
                The left sidebar is your home base. Here&apos;s what each section does:
              </p>
              <div className="guided-nav-guide">
                <div className="guided-nav-item">
                  <BookOpen size={18} />
                  <div>
                    <strong>Academy &amp; Classes</strong>
                    <p>Browse all lessons &amp; masterclasses, filter by category.</p>
                  </div>
                </div>
                <div className="guided-nav-item">
                  <Compass size={18} />
                  <div>
                    <strong>3D Skill Universe</strong>
                    <p>See a 3D galaxy of your skills. Click any node to inspect mastery.</p>
                  </div>
                </div>
                <div className="guided-nav-item">
                  <ShieldCheck size={18} />
                  <div>
                    <strong>Risk Laboratory</strong>
                    <p>7 calculators: position sizing, leverage, drawdown, correlation.</p>
                  </div>
                </div>
                <div className="guided-nav-item">
                  <Target size={18} />
                  <div>
                    <strong>Achievements</strong>
                    <p>24 badges to unlock. Healthy gamification — never rewards profit, only discipline.</p>
                  </div>
                </div>
                <div className="guided-nav-item">
                  <Brain size={18} />
                  <div>
                    <strong>AI Learning Coach</strong>
                    <p>Ask any trading question. Powered by an LLM, grounded in your progress.</p>
                  </div>
                </div>
              </div>
              <div className="guided-final-cta">
                <Rocket size={16} />
                <span>Ready to begin? Take the 2-minute diagnostic test to find your starting level.</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="guided-nav-buttons">
          <button className="guided-back-btn" onClick={back} disabled={stepIndex === 0}>
            <ArrowLeft size={14} /> Back
          </button>
          <button className="guided-next-btn" onClick={next}>
            {stepIndex === STEPS.length - 1 ? (
              <>
                <Rocket size={14} /> Begin My Journey
              </>
            ) : (
              <>
                Continue <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
