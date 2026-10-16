"use client";

import React, { useState } from "react";
import {
  Rocket,
  Briefcase,
  Heart,
  DollarSign,
  GraduationCap,
  Clock,
  Eye,
  BookOpen,
  MousePointerClick,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  Target,
  Zap,
} from "lucide-react";

type Props = {
  onComplete: (profile: {
    learningGoal: string;
    dailyGoalMinutes: number;
    learningStyle: string;
    studyReminderHour: number | null;
  }) => void;
  initial?: {
    learningGoal?: string;
    dailyGoalMinutes?: number;
    learningStyle?: string;
    studyReminderHour?: number | null;
  };
};

const GOALS = [
  { id: "career", label: "Career in Trading", icon: Briefcase, desc: "I want to become a professional trader or work in finance.", color: "#1d4d3a" },
  { id: "hobby", label: "Personal Growth", icon: Heart, desc: "Curious about markets — building personal knowledge.", color: "#c43c3c" },
  { id: "income", label: "Side Income", icon: DollarSign, desc: "Exploring supplemental income through informed decisions.", color: "#d9480f" },
  { id: "education", label: "Academic Study", icon: GraduationCap, desc: "Studying for finance courses or certifications.", color: "#1864ab" },
];

const TIME_OPTIONS = [
  { minutes: 5, label: "5 min/day", desc: "Bite-sized. Consistency over volume." },
  { minutes: 15, label: "15 min/day", desc: "One focused lesson daily." },
  { minutes: 30, label: "30 min/day", desc: "Lesson + quiz + revision." },
  { minutes: 60, label: "60 min/day", desc: "Deep work — lessons + simulator practice." },
];

const STYLES = [
  { id: "visual", label: "Visual Learner", icon: Eye, desc: "Diagrams, charts, and color-coded concepts stick best." },
  { id: "reading", label: "Reader & Writer", icon: BookOpen, desc: "I absorb most from written explanations and note-taking." },
  { id: "interactive", label: "Hands-On", icon: MousePointerClick, desc: "I learn by doing — simulators and interactive exercises." },
  { id: "mixed", label: "Balanced Mix", icon: Sparkles, desc: "I benefit from a blend of all modalities." },
];

const STEPS = ["goal", "time", "style", "path"] as const;
type Step = typeof STEPS[number];

export default function AdaptiveOnboarding({ onComplete, initial }: Props) {
  const [step, setStep] = useState<Step>("goal");
  const [learningGoal, setLearningGoal] = useState(initial?.learningGoal || "");
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(initial?.dailyGoalMinutes || 20);
  const [learningStyle, setLearningStyle] = useState(initial?.learningStyle || "mixed");
  const [studyReminderHour, setStudyReminderHour] = useState<number | null>(
    initial?.studyReminderHour ?? null
  );

  const stepIndex = STEPS.indexOf(step);
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100;

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    else {
      onComplete({ learningGoal, dailyGoalMinutes, learningStyle, studyReminderHour });
    }
  }
  function back() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  // Generate personalised learning path recommendation
  const recommendedPath = (() => {
    if (learningGoal === "career") {
      return {
        title: "Career-Track Foundation Path",
        desc: "Full curriculum mastery with deep risk management emphasis. Estimated 8-12 weeks at your chosen pace.",
        modules: ["Forex Foundations", "Technical Analysis", "Risk Management (Deep Dive)", "Trading Psychology", "Strategy Backtesting", "Performance Analytics"],
        icon: Briefcase,
      };
    }
    if (learningGoal === "income") {
      return {
        title: "Practical Income Path",
        desc: "Focus on actionable risk management and disciplined execution. Estimated 4-6 weeks.",
        modules: ["Forex Foundations", "Risk Management", "Trading Psychology", "Strategy Backtesting"],
        icon: DollarSign,
      };
    }
    if (learningGoal === "education") {
      return {
        title: "Academic Study Path",
        desc: "Comprehensive theory with all five learning paths. Estimated 10-14 weeks.",
        modules: ["Forex Foundations", "Technical Analysis", "Risk Management", "Binary Options Theory", "Trading Psychology"],
        icon: GraduationCap,
      };
    }
    return {
      title: "Personal Growth Path",
      desc: "Foundational knowledge at a relaxed pace. Estimated 6-8 weeks.",
      modules: ["Forex Foundations", "Risk Management Basics", "Trading Psychology"],
      icon: Heart,
    };
  })();

  const styleAdjustment = (() => {
    if (learningStyle === "visual") return "Visual diagrams and chart annotations will be prioritised in your lesson player.";
    if (learningStyle === "reading") return "Written lesson content and downloadable notes will be surfaced first.";
    if (learningStyle === "interactive") return "Simulator exercises and interactive quizzes will appear earlier in each module.";
    return "Your dashboard will balance all modalities equally.";
  })();

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Progress header */}
        <div className="onboarding-progress-bar">
          <div className="onboarding-progress-fill" style={{ width: `${progressPct}%` }} />
          <div className="onboarding-progress-meta">
            <div className="onboarding-kicker">
              <Rocket size={13} /> ADAPTIVE ONBOARDING · STEP {stepIndex + 1} / {STEPS.length}
            </div>
            <span>{Math.round(progressPct)}% complete</span>
          </div>
        </div>

        {/* Step: Goal */}
        {step === "goal" && (
          <div className="onboarding-step">
            <h2>What brings you to Atlas Academy?</h2>
            <p className="onboarding-step-desc">
              Your goal shapes the curriculum emphasis. There are no wrong answers — only honest ones that help us tailor your journey.
            </p>
            <div className="onboarding-choice-grid">
              {GOALS.map(g => {
                const Icon = g.icon;
                const isSelected = learningGoal === g.id;
                return (
                  <button
                    key={g.id}
                    className={`onboarding-choice ${isSelected ? "selected" : ""}`}
                    onClick={() => setLearningGoal(g.id)}
                    style={isSelected ? { borderColor: g.color, background: `${g.color}0d` } : {}}
                  >
                    <div className="choice-icon" style={{ background: `${g.color}1a`, color: g.color }}>
                      <Icon size={22} />
                    </div>
                    <strong>{g.label}</strong>
                    <p>{g.desc}</p>
                    {isSelected && <Check className="choice-check" size={16} style={{ color: g.color }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Time */}
        {step === "time" && (
          <div className="onboarding-step">
            <h2>How much time can you commit daily?</h2>
            <p className="onboarding-step-desc">
              Honest time budgets beat ambitious ones. We&apos;ll space your lessons to fit — and the simulator will always be open for unscheduled practice.
            </p>
            <div className="onboarding-time-grid">
              {TIME_OPTIONS.map(opt => {
                const isSelected = dailyGoalMinutes === opt.minutes;
                return (
                  <button
                    key={opt.minutes}
                    className={`onboarding-time-choice ${isSelected ? "selected" : ""}`}
                    onClick={() => setDailyGoalMinutes(opt.minutes)}
                  >
                    <Clock size={20} />
                    <strong>{opt.label}</strong>
                    <p>{opt.desc}</p>
                    {isSelected && <Check className="choice-check" size={16} />}
                  </button>
                );
              })}
            </div>

            <div className="onboarding-reminder-row">
              <label>
                <span>Daily study reminder (UTC hour):</span>
                <select
                  value={studyReminderHour ?? ""}
                  onChange={e => setStudyReminderHour(e.target.value === "" ? null : Number(e.target.value))}
                >
                  <option value="">No reminder</option>
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00 UTC
                    </option>
                  ))}
                </select>
              </label>
              <p className="reminder-hint">
                Optional — we&apos;ll surface revision cards in your dashboard at this time. Adjust anytime in Profile.
              </p>
            </div>
          </div>
        )}

        {/* Step: Style */}
        {step === "style" && (
          <div className="onboarding-step">
            <h2>How do you learn best?</h2>
            <p className="onboarding-step-desc">
              Your learning style influences lesson ordering — visual learners see charts first, hands-on learners jump to simulators earlier.
            </p>
            <div className="onboarding-choice-grid">
              {STYLES.map(s => {
                const Icon = s.icon;
                const isSelected = learningStyle === s.id;
                return (
                  <button
                    key={s.id}
                    className={`onboarding-choice ${isSelected ? "selected" : ""}`}
                    onClick={() => setLearningStyle(s.id)}
                  >
                    <div className="choice-icon">
                      <Icon size={22} />
                    </div>
                    <strong>{s.label}</strong>
                    <p>{s.desc}</p>
                    {isSelected && <Check className="choice-check" size={16} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Path preview */}
        {step === "path" && (
          <div className="onboarding-step">
            <h2>Your Personalised Learning Path</h2>
            <p className="onboarding-step-desc">
              Based on your goal, time budget, and learning style, we&apos;ve composed this curriculum sequence for you. You can always explore beyond it.
            </p>

            <div className="path-preview-card">
              <div className="path-preview-header">
                {(() => {
                  const Icon = recommendedPath.icon;
                  return (
                    <div className="path-preview-icon">
                      <Icon size={20} />
                    </div>
                  );
                })()}
                <div>
                  <strong>{recommendedPath.title}</strong>
                  <p>{recommendedPath.desc}</p>
                </div>
              </div>

              <div className="path-modules">
                {recommendedPath.modules.map((m, idx) => (
                  <div key={idx} className="path-module-pill">
                    <span className="path-module-num">{idx + 1}</span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="path-summary-grid">
              <div className="path-summary-tile">
                <Target size={16} />
                <span>Daily Commitment</span>
                <strong>{dailyGoalMinutes} min/day</strong>
              </div>
              <div className="path-summary-tile">
                <Sparkles size={16} />
                <span>Learning Style</span>
                <strong>{STYLES.find(s => s.id === learningStyle)?.label}</strong>
              </div>
              <div className="path-summary-tile">
                <Zap size={16} />
                <span>Style Adjustment</span>
                <strong>{styleAdjustment}</strong>
              </div>
            </div>

            {studyReminderHour !== null && (
              <div className="path-reminder-banner">
                <Clock size={14} />
                <span>
                  Daily reminder scheduled for {String(studyReminderHour).padStart(2, "0")}:00 UTC. We&apos;ll surface revision cards in your dashboard at this time.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="onboarding-nav">
          <button
            className="onboarding-back-btn"
            onClick={back}
            disabled={stepIndex === 0}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            className="onboarding-next-btn"
            onClick={next}
            disabled={step === "goal" && !learningGoal}
          >
            {stepIndex === STEPS.length - 1 ? (
              <>
                <Rocket size={14} /> Begin Learning Journey
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
