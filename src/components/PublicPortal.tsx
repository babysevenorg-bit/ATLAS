"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  BrainCircuit,
  Calculator,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Clock,
  Award,
  HelpCircle,
  FileText,
  UserCheck
} from "lucide-react";
import { LEARNING_PATHS, SKILLS_TAXONOMY } from "@/lib/curriculum";

type Props = {
  onEnterWorkspace: (persona?: "beginner" | "developing" | "advanced" | "admin") => void;
  onOpenAuth: (mode: "login" | "register") => void;
};

export default function PublicPortal({ onEnterWorkspace, onOpenAuth }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "paths" | "methodology" | "disclosures" | "faqs">("overview");

  return (
    <div className="public-portal-container">
      {/* Public Top Navbar */}
      <header className="public-navbar">
        <div className="public-brand">
          <div className="brand-mark">
            <span>◆</span>
          </div>
          <div>
            <span className="brand-name">atlas<span>.</span></span>
            <span className="brand-caption">ADAPTIVE TRADING ACADEMY</span>
          </div>
        </div>

        <nav className="public-nav-links">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pub-nav-btn ${activeTab === "overview" ? "active" : ""}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("paths")}
            className={`pub-nav-btn ${activeTab === "paths" ? "active" : ""}`}
          >
            Curriculum Paths
          </button>
          <button
            onClick={() => setActiveTab("methodology")}
            className={`pub-nav-btn ${activeTab === "methodology" ? "active" : ""}`}
          >
            Adaptive Methodology
          </button>
          <button
            onClick={() => setActiveTab("disclosures")}
            className={`pub-nav-btn ${activeTab === "disclosures" ? "active" : ""}`}
          >
            Risk & Legal
          </button>
          <button
            onClick={() => setActiveTab("faqs")}
            className={`pub-nav-btn ${activeTab === "faqs" ? "active" : ""}`}
          >
            FAQs
          </button>
        </nav>

        <div className="public-nav-actions">
          <button
            onClick={() => onOpenAuth("login")}
            className="pub-login-btn"
          >
            Sign In
          </button>
          <button
            onClick={() => onEnterWorkspace("beginner")}
            className="pub-cta-btn"
          >
            Launch Academy <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* TAB 1: OVERVIEW & HERO */}
      {activeTab === "overview" && (
        <div className="public-hero-section">
          <div className="hero-announcement">
            <span className="badge">VERSION 1.0 BLUEPRINT</span>
            <span>Self-Evolving Financial Education · Zero Real-Money Risk</span>
          </div>

          <h1 className="hero-main-title">
            Learn Trading From Zero.<br />
            <span>Measure Understanding. Master Risk.</span>
          </h1>

          <p className="hero-subtext">
            An adaptive trading academy that measures your demonstrated skill mastery, guides historical replay training without look-ahead bias, and teaches the strict mathematical defense of capital before any simulated trade.
          </p>

          <div className="hero-cta-group">
            <button
              onClick={() => onEnterWorkspace("beginner")}
              className="primary-hero-btn"
            >
              Start Free Learning Journey <ArrowRight size={18} />
            </button>
            <button
              onClick={() => setActiveTab("methodology")}
              className="secondary-hero-btn"
            >
              Explore Adaptive Engine
            </button>
          </div>

          {/* Persona Demo Switcher Banner */}
          <div className="persona-quick-switcher">
            <div className="switcher-head">
              <UserCheck size={18} />
              <span>Experience The Academy By Persona:</span>
            </div>
            <div className="persona-buttons-grid">
              <button
                onClick={() => onEnterWorkspace("beginner")}
                className="persona-pill"
              >
                <strong>Persona A: Complete Beginner</strong>
                <small>Starts at Chapter 01 Foundations</small>
              </button>
              <button
                onClick={() => onEnterWorkspace("developing")}
                className="persona-pill"
              >
                <strong>Persona B: Developing Learner</strong>
                <small>Intermediate Risk & Structure</small>
              </button>
              <button
                onClick={() => onEnterWorkspace("advanced")}
                className="persona-pill"
              >
                <strong>Persona C: Advanced Practitioner</strong>
                <small>Replay Lab & Drawdown Math</small>
              </button>
              <button
                onClick={() => onEnterWorkspace("admin")}
                className="persona-pill admin"
              >
                <strong>Platform Administrator</strong>
                <small>Knowledge Studio Authoring</small>
              </button>
            </div>
          </div>

          {/* 4 Pillars Grid */}
          <div className="pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon green">
                <BookOpen size={24} />
              </div>
              <h3>1. Structured Academy</h3>
              <p>
                Five comprehensive learning paths with prerequisite-gated chapters, bite-sized lessons, and mandatory verification quizzes.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon blue">
                <BrainCircuit size={24} />
              </div>
              <h3>2. Adaptive Progression</h3>
              <p>
                Diagnostic placement engine, 6-state skill mastery tracking, and automated spaced-repetition revision queues.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon amber">
                <TrendingUp size={24} />
              </div>
              <h3>3. Historical Replay Lab</h3>
              <p>
                Candlestick replay with zero look-ahead bias, embedded position sizing calculations, and plan-first trade journaling.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon purple">
                <Calculator size={24} />
              </div>
              <h3>4. Risk & Binary Labs</h3>
              <p>
                Deep mathematical laboratories for position sizing, losing streak probabilities, and binary options expected value.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CURRICULUM PATHS */}
      {activeTab === "paths" && (
        <div className="public-content-section">
          <div className="section-header">
            <span className="section-kicker">CURRICULUM SPECIFICATION</span>
            <h2>Five Comprehensive Learning Pathways</h2>
            <p>Every concept builds a skill. Every assessment provides evidence.</p>
          </div>

          <div className="paths-list-grid">
            {LEARNING_PATHS.map(path => (
              <div key={path.id} className="path-overview-card">
                <div className="path-top-row">
                  <span className="category-pill">{path.categoryBadge}</span>
                  <span className="diff-pill">{path.difficulty}</span>
                </div>

                <h3>{path.title}</h3>
                <p>{path.description}</p>

                <div className="path-specs">
                  <div>
                    <Clock size={15} /> <span>~{path.estimatedHours} Hours</span>
                  </div>
                  <div>
                    <BookOpen size={15} /> <span>{path.lessonCount} Lessons</span>
                  </div>
                </div>

                <div className="prereq-note">
                  <LockKeyhole size={14} />
                  <span>{path.prerequisitesDescription}</span>
                </div>

                <button
                  onClick={() => onEnterWorkspace("beginner")}
                  className="path-start-btn"
                >
                  Explore Path in Workspace <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ADAPTIVE METHODOLOGY */}
      {activeTab === "methodology" && (
        <div className="public-content-section">
          <div className="section-header">
            <span className="section-kicker">HOW ADAPTIVE LEARNING WORKS</span>
            <h2>Demonstrated Mastery Over Time Spent</h2>
            <p>A deterministic progression engine that respects knowledge retention.</p>
          </div>

          <div className="methodology-steps-grid">
            <div className="method-step-card">
              <div className="step-num">01</div>
              <h4>Orientation & Diagnostic Placement</h4>
              <p>
                New learners take an optional 10-topic diagnostic assessment. Advanced practitioners can skip mastered basics; beginners receive foundational guidance.
              </p>
            </div>

            <div className="method-step-card">
              <div className="step-num">02</div>
              <h4>Deterministic Prerequisite Gating</h4>
              <p>
                Lessons enforce verified prerequisite skills before unlocking advanced simulation exercises. No learner is thrown into complex setups unprepared.
              </p>
            </div>

            <div className="method-step-card">
              <div className="step-num">03</div>
              <h4>Six Skill Mastery States</h4>
              <p>
                Skills transition between Not Started → Learning → Developing → Practising → Demonstrated → Needs Revision based on assessment and simulated evidence.
              </p>
            </div>

            <div className="method-step-card">
              <div className="step-num">04</div>
              <h4>SuperMemo Spaced Repetition</h4>
              <p>
                Completed concepts automatically schedule into a daily review queue at increasing intervals (1d, 3d, 7d, 14d) to ensure durable retention.
              </p>
            </div>
          </div>

          <div className="skills-taxonomy-preview">
            <h3>Measurable Skills Taxonomy</h3>
            <div className="taxonomy-grid">
              {SKILLS_TAXONOMY.map(skill => (
                <div key={skill.id} className="skill-pill-box">
                  <code>{skill.code}</code>
                  <strong>{skill.name}</strong>
                  <p>{skill.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RISK & REGULATORY DISCLOSURES */}
      {activeTab === "disclosures" && (
        <div className="public-content-section">
          <div className="section-header">
            <span className="section-kicker">SAFETY, ETHICS & COMPLIANCE</span>
            <h2>Financial & Regulatory Boundaries</h2>
            <p>Transparency and honesty over false promises.</p>
          </div>

          <div className="disclosures-card-deck">
            <div className="disclosure-item-card">
              <div className="disc-icon danger">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h4>1. Strictly Educational Virtual Platform</h4>
                <p>
                  Atlas Academy is not a broker, investment adviser, or financial services provider. All trading activities occur on simulated virtual accounts with zero real money deposit, withdrawal, or execution capabilities.
                </p>
              </div>
            </div>

            <div className="disclosure-item-card">
              <div className="disc-icon green">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4>2. No Guaranteed Profit or AI Signal Claims</h4>
                <p>
                  We explicitly reject misleading claims of guaranteed returns, secret automated trading algorithms, or verified real-world profitability. Simulated success does not imply future real-world performance.
                </p>
              </div>
            </div>

            <div className="disclosure-item-card">
              <div className="disc-icon amber">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4>3. Binary Options Jurisdictional Warnings</h4>
                <p>
                  Binary options are prohibited for retail consumers by the UK Financial Conduct Authority (FCA), European Securities and Markets Authority (ESMA), and Australian Securities and Investments Commission (ASIC). Our binary options pathway exists solely to demonstrate the mathematical house edge and negative expected value of fixed-payout contracts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FAQS */}
      {activeTab === "faqs" && (
        <div className="public-content-section">
          <div className="section-header">
            <span className="section-kicker">QUESTIONS & ANSWERS</span>
            <h2>Frequently Asked Questions</h2>
          </div>

          <div className="faqs-accordion">
            <div className="faq-item">
              <h4>Do I need real money or a credit card to use Atlas Academy?</h4>
              <p>
                No. Atlas Academy is 100% free and educational. Every learner receives a virtual demo balance ($10,000) for testing market scenarios without financial risk.
              </p>
            </div>

            <div className="faq-item">
              <h4>How does the historical replay engine prevent hindsight bias?</h4>
              <p>
                Our replay engine obscures all future price candles until you step forward in time or execute a simulated order, ensuring your decisions reflect true real-time uncertainty.
              </p>
            </div>

            <div className="faq-item">
              <h4>Can administrators add new lessons without code deployments?</h4>
              <p>
                Yes! The built-in Knowledge Studio enables administrators to create, validate, and publish new courses, chapters, and assessment quizzes dynamically through the database.
              </p>
            </div>

            <div className="faq-item">
              <h4>What is the difference between Process Quality and P&L Outcome?</h4>
              <p>
                In probabilistic trading, a reckless trade can make money by luck, and a disciplined trade can lose. We grade your trade execution by plan adherence and risk limits rather than random outcomes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
