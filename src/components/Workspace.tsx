"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  TrendingDown,
  X,
  Zap,
  ChartNoAxesCombined,
  ClipboardList,
  Play,
  RotateCcw,
  Lightbulb,
  Send,
  FileText,
  CheckCircle,
  Circle,
  Calculator,
  AlertCircle,
  BrainCircuit,
  SplitSquareVertical,
  Layers,
  Award,
  BarChart3,
  Flame,
  UserCheck,
  DollarSign,
  Star,
  Film,
  ListPlus,
  Cpu,
  Activity,
  Gauge,
  Globe2,
  Rocket,
  Notebook,
  Scale
} from "lucide-react";

import type { Lesson, LearningPathMeta, Skill, Masterclass } from "@/lib/curriculum";
import { LEARNING_PATHS, SKILLS_TAXONOMY, MASTERCLASSES_CATALOG, isUnlocked } from "@/lib/curriculum";
import TradingLab from "@/components/TradingLab";
import BinaryOptionsLab from "@/components/BinaryOptionsLab";
import RiskLaboratory from "@/components/RiskLaboratory";
import RevisionDeck from "@/components/RevisionDeck";
import BacktestArena from "@/components/BacktestArena";
import MonteCarloEquity from "@/components/MonteCarloEquity";
import SkillUniverse3D from "@/components/SkillUniverse3D";
import LearningAnalyticsDashboard from "@/components/LearningAnalyticsDashboard";
import AdaptiveOnboarding from "@/components/AdaptiveOnboarding";
import AchievementsGallery from "@/components/AchievementsGallery";
import GuidedWelcome from "@/components/GuidedWelcome";
import NextStepsPanel from "@/components/NextStepsPanel";
import LearningPathRoadmap from "@/components/LearningPathRoadmap";
import DiagnosticModal from "@/components/DiagnosticModal";
import PublicPortal from "@/components/PublicPortal";
import LiveMarketTicker from "@/components/LiveMarketTicker";
import NetflixCard from "@/components/NetflixCard";
import ClassDetailModal from "@/components/ClassDetailModal";
import InteractiveLessonPlayer from "@/components/InteractiveLessonPlayer";
import TradingJournal from "@/components/TradingJournal";
import LegalHub from "@/components/LegalHub";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  persona?: string;
  virtualBalance?: number;
  experiencePoints?: number;
} | null;

type Props = {
  initialSection: string;
  lessons: Lesson[];
  initialCompleted: string[];
  user: User;
};

const navItems = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "academy", label: "Academy & Classes", icon: BookOpen },
  { id: "trading-lab", label: "Trading Lab", icon: ChartNoAxesCombined, badge: "REPLAY" },
  { id: "risk-lab", label: "Risk Laboratory", icon: Calculator },
  { id: "backtest", label: "Backtest Arena", icon: Cpu, badge: "NEW" },
  { id: "monte-carlo", label: "Monte Carlo Lab", icon: Activity, badge: "NEW" },
  { id: "skill-universe", label: "3D Skill Universe", icon: Globe2, badge: "3D" },
  { id: "analytics", label: "Learning Analytics", icon: BarChart3, badge: "NEW" },
  { id: "achievements", label: "Achievements", icon: Award, badge: "NEW" },
  { id: "binary-lab", label: "Binary Options Lab", icon: SplitSquareVertical },
  { id: "revision", label: "Daily Revision", icon: BrainCircuit, badge: "DUE" },
  { id: "coach", label: "AI Learning Coach", icon: Sparkles },
  { id: "progress", label: "Skills & Analytics", icon: TrendingUp },
  { id: "journal", label: "Trading Journal", icon: Notebook, badge: "NEW" },
  { id: "legal", label: "Legal & Compliance", icon: Scale },
];

export default function Workspace({ initialSection, lessons, initialCompleted, user }: Props) {
  const router = useRouter();
  const [section, setSection] = useState(initialSection);
  const [completed, setCompleted] = useState<string[]>(initialCompleted);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");

  // Netflix Preview Modal State
  const [selectedMasterclass, setSelectedMasterclass] = useState<Masterclass | null>(null);
  const [savedClassIds, setSavedClassIds] = useState<string[]>(["class-forex-mastery", "class-risk-defense"]);

  // Modals & Navigation State
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [toastNotice, setToastNotice] = useState("");
  const [guidedWelcomeSeen, setGuidedWelcomeSeen] = useState(false);

  // Check localStorage on mount — show guided welcome for first-time visitors (guests included)
  useEffect(() => {
    try {
      const seen = localStorage.getItem("atlas_guided_welcome_seen");
      if (seen) setGuidedWelcomeSeen(true);
    } catch {}
  }, []);
  const [isPublicLanding, setIsPublicLanding] = useState(false);

  // Persona State
  const [activePersona, setActivePersona] = useState<string>(user?.persona || "beginner");
  const [virtualBalance, setVirtualBalance] = useState<number>(user?.virtualBalance || 10000);
  const [experiencePoints, setExperiencePoints] = useState<number>(user?.experiencePoints || 0);

  // AI Coach Chat State
  const [coachInput, setCoachInput] = useState("");
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachHistory, setCoachHistory] = useState<{ question: string; answer: string; related?: { id: string; title: string }[] }[]>([
    {
      question: "How should I structure my learning journey?",
      answer: "Welcome to Atlas Academy! Start with our **#1 Masterclass: Forex Foundations** to master currency pair quotes and pip calculations. Next, dive into the **Capital Defense & Position Sizing Lab** before testing your setups in the **Trading Replay Lab**.",
      related: [
        { id: "what-is-forex", title: "What is the Forex Market?" },
        { id: "risk-per-trade", title: "The 1% Rule" }
      ]
    }
  ]);

  // Admin Knowledge Studio State
  const [draftsList, setDraftsList] = useState<any[]>([]);
  const [studioModalOpen, setStudioModalOpen] = useState(false);
  const [studioBusy, setStudioBusy] = useState(false);
  const [studioError, setStudioError] = useState("");

  // Sync section from URL or prop
  useEffect(() => {
    setSection(initialSection);
    setActiveLessonId(null);
  }, [initialSection]);

  // Restore guest storage if unauthenticated
  useEffect(() => {
    if (!user) {
      try {
        const saved = JSON.parse(localStorage.getItem("atlas_demo_completed") || "[]");
        if (Array.isArray(saved) && saved.length > 0) setCompleted(saved);
        const savedPersona = localStorage.getItem("atlas_demo_persona");
        if (savedPersona) setActivePersona(savedPersona);
        const savedClasses = JSON.parse(localStorage.getItem("atlas_saved_classes") || "[]");
        if (Array.isArray(savedClasses) && savedClasses.length > 0) setSavedClassIds(savedClasses);
      } catch {}
    }
  }, [user]);

  // Load Admin Drafts when viewing Studio
  useEffect(() => {
    if (section === "studio" && user && user.role !== "learner") {
      fetch("/api/admin/lessons")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setDraftsList(data);
        })
        .catch(() => {});
    }
  }, [section, user]);

  const completedCount = lessons.filter(l => completed.includes(l.id)).length;
  const progressPercent = Math.round((completedCount / Math.max(lessons.length, 1)) * 100);
  const currentLesson = lessons.find(l => l.id === activeLessonId);

  // Featured Top Masterclass for Hero Banner
  const featuredClass = MASTERCLASSES_CATALOG[0];

  // Next Recommended Lesson Engine
  const nextLesson = useMemo(() => {
    return lessons.find(l => !completed.includes(l.id) && isUnlocked(l, completed)) || lessons[0];
  }, [lessons, completed]);

  // Skills demonstrated count
  const demonstratedSkillsCount = useMemo(() => {
    const activeSkills = new Set<string>();
    lessons.filter(l => completed.includes(l.id)).forEach(l => {
      l.skillIds.forEach(s => activeSkills.add(s));
    });
    return activeSkills.size;
  }, [lessons, completed]);

  const isAdmin = user && ["owner", "administrator", "editor"].includes(user.role);

  function navigateTo(targetSection: string) {
    setSection(targetSection);
    setActiveLessonId(null);
    setMobileOpen(false);
    setSearch("");
    setIsPublicLanding(false);
    if (targetSection === "dashboard") router.push("/");
    else router.push(`/workspace/${targetSection}`);
  }

  function openLesson(lessonId: string) {
    setActiveLessonId(lessonId);
    setSelectedMasterclass(null);
    setSection("academy");
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleSaveClass(classId: string) {
    setSavedClassIds(prev => {
      const next = prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId];
      try {
        localStorage.setItem("atlas_saved_classes", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  // Handle Assessment Completion from Player
  // Returns true if the answer was correct (regardless of whether the API saved it).
  // This way the user can always progress even if the server is down.
  async function handleLessonAssessment(lessonId: string, answerIdx: number): Promise<boolean> {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return false;

    // Check correctness locally first — this is the source of truth for progression
    const isLocallyCorrect = answerIdx === lesson.answer;

    if (user) {
      // Authenticated: try to save to the server
      try {
        const res = await fetch("/api/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, answer: answerIdx }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.correct) {
          // Server confirmed correct — update local state
          setCompleted(prev => [...new Set([...prev, lessonId])]);
          if (data.xpGained) setExperiencePoints(xp => xp + data.xpGained);
          return true;
        } else if (res.ok && !data.correct) {
          // Server says wrong answer — don't update completion
          return false;
        } else {
          // API returned an error (500, 401, etc.) — use local correctness
          // so the user can still progress
          if (isLocallyCorrect) {
            setCompleted(prev => [...new Set([...prev, lessonId])]);
            setExperiencePoints(xp => xp + 50);
          }
          return isLocallyCorrect;
        }
      } catch {
        // Network error — use local correctness
        if (isLocallyCorrect) {
          setCompleted(prev => [...new Set([...prev, lessonId])]);
          setExperiencePoints(xp => xp + 50);
        }
        return isLocallyCorrect;
      }
    } else {
      // Guest: local-only execution
      if (isLocallyCorrect) {
        const updated = [...new Set([...completed, lessonId])];
        setCompleted(updated);
        setExperiencePoints(xp => xp + 50);
        try {
          localStorage.setItem("atlas_demo_completed", JSON.stringify(updated));
        } catch {}
      }
      return isLocallyCorrect;
    }
  }

  // Ask AI Learning Coach
  async function handleAskCoach(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = coachInput.trim();
    if (!query || coachBusy) return;

    setCoachBusy(true);
    setCoachInput("");

    try {
      const res = await fetch("/api/coach/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      if (res.ok) {
        setCoachHistory(prev => [
          ...prev,
          { question: query, answer: data.answer, related: data.relatedLessons }
        ]);
      } else {
        setCoachHistory(prev => [
          ...prev,
          { question: query, answer: data.error || "I could not retrieve an explanation right now." }
        ]);
      }
    } catch {
      setCoachHistory(prev => [
        ...prev,
        { question: query, answer: "Connection error. Please try again." }
      ]);
    }
    setCoachBusy(false);
  }

  // Handle Authentication
  async function handleAuthSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: authMode,
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Authentication failed.");
      } else {
        setAuthOpen(false);
        window.location.href = "/";
      }
    } catch {
      setAuthError("Server unavailable. Please try again.");
    }
    setAuthBusy(false);
  }

  // Handle Logout
  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    window.location.href = "/";
  }

  // Fast Persona Switching
  function switchPersona(persona: "beginner" | "developing" | "advanced" | "admin") {
    if (persona === "beginner") {
      setActivePersona("beginner");
      setCompleted([]);
      localStorage.setItem("atlas_demo_completed", JSON.stringify([]));
      localStorage.setItem("atlas_demo_persona", "beginner");
      navigateTo("dashboard");
    } else if (persona === "developing") {
      setActivePersona("developing");
      const devUnlocked = ["what-is-forex", "currency-pairs", "pips-spreads", "lot-sizes-leverage", "order-types"];
      setCompleted(devUnlocked);
      localStorage.setItem("atlas_demo_completed", JSON.stringify(devUnlocked));
      localStorage.setItem("atlas_demo_persona", "developing");
      navigateTo("dashboard");
    } else if (persona === "advanced") {
      setActivePersona("advanced");
      const advUnlocked = lessons.map(l => l.id);
      setCompleted(advUnlocked);
      localStorage.setItem("atlas_demo_completed", JSON.stringify(advUnlocked));
      localStorage.setItem("atlas_demo_persona", "advanced");
      navigateTo("trading-lab");
    } else if (persona === "admin") {
      navigateTo("studio");
    }
    setToastNotice(`Calibrated Persona: ${persona.toUpperCase()}`);
    setTimeout(() => setToastNotice(""), 3500);
  }

  // Reset Virtual Balance
  async function resetVirtualBalance() {
    try {
      await fetch("/api/simulation/reset", { method: "POST" });
      setVirtualBalance(10000);
      setToastNotice("Virtual balance reset to $10,000.00!");
      setTimeout(() => setToastNotice(""), 3500);
    } catch {}
  }

  // Save Admin Draft Lesson
  async function handleSaveDraft(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStudioBusy(true);
    setStudioError("");
    const form = new FormData(e.currentTarget);

    const payload = {
      title: form.get("title"),
      description: form.get("description"),
      pathId: form.get("pathId"),
      category: form.get("category"),
      level: form.get("level"),
      duration: form.get("duration"),
      prerequisiteId: form.get("prerequisiteId") || null,
      content: form.get("content"),
      takeaway: form.get("takeaway"),
      question: form.get("question"),
      options: [0, 1, 2, 3].map(i => form.get(`option${i}`)),
      answer: Number(form.get("answer")),
      explanation: form.get("explanation"),
    };

    try {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setStudioError(data.error);
      } else {
        setStudioModalOpen(false);
        setToastNotice("New lesson draft created! Ready to publish.");
        const updated = await fetch("/api/admin/lessons").then(r => r.json());
        setDraftsList(updated);
      }
    } catch {
      setStudioError("Unable to save draft.");
    }
    setStudioBusy(false);
  }

  // Publish Draft
  async function publishLesson(id: string) {
    const res = await fetch("/api/admin/lessons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "published" }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setToastNotice("Could not publish lesson.");
    }
  }

  // Filtered Masterclasses for Category Filter Bar
  const filteredMasterclasses = useMemo(() => {
    if (selectedCategoryFilter === "All") return MASTERCLASSES_CATALOG;
    if (selectedCategoryFilter === "Top 10") return MASTERCLASSES_CATALOG.filter(c => c.top10Rank);
    if (selectedCategoryFilter === "My List") return MASTERCLASSES_CATALOG.filter(c => savedClassIds.includes(c.id));
    return MASTERCLASSES_CATALOG.filter(c => c.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase()));
  }, [selectedCategoryFilter, savedClassIds]);

  // Render Public Landing View if requested
  if (isPublicLanding) {
    return (
      <PublicPortal
        onEnterWorkspace={(p) => {
          setIsPublicLanding(false);
          if (p) switchPersona(p);
        }}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthOpen(true);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand" onClick={() => navigateTo("dashboard")} role="button" tabIndex={0}>
          <div className="brand-mark">
            <span>◆</span>
          </div>
          <div>
            <div className="brand-name">atlas<span>.</span></div>
            <div className="brand-caption">ADAPTIVE ACADEMY</div>
          </div>
        </div>

        <div className="sidebar-scroll">
          <div className="nav-group-label">WORKSPACE MODULES</div>
          <nav className="nav-list" aria-label="Main Navigation">
            {navItems.map(item => (
              <Link
                key={item.id}
                href={item.id === "dashboard" ? "/" : `/workspace/${item.id}`}
                onClick={e => {
                  e.preventDefault();
                  navigateTo(item.id);
                }}
                className={`nav-link ${section === item.id ? "active" : ""}`}
              >
                <item.icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.badge && <span className="nav-new">{item.badge}</span>}
              </Link>
            ))}
          </nav>

          <div className="nav-group-label second">LEARNING JOURNEY</div>
          <div className="sidebar-path">
            <div className="path-icon">
              <GraduationCap size={19} />
            </div>
            <div>
              <strong>Forex & Risk Mastery</strong>
              <span>{completedCount} of {lessons.length} Lessons</span>
            </div>
            <ChevronRight size={16} />
          </div>

          <div className="sidebar-progress">
            <div style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="sidebar-persona-badge">
            <UserCheck size={14} />
            <span>Persona: {activePersona.toUpperCase()}</span>
          </div>

          {isAdmin && (
            <>
              <div className="nav-group-label second">ADMINISTRATION</div>
              <Link
                href="/workspace/studio"
                onClick={e => {
                  e.preventDefault();
                  navigateTo("studio");
                }}
                className={`nav-link ${section === "studio" ? "active" : ""}`}
              >
                <Settings2 size={18} />
                <span>Knowledge Studio</span>
              </Link>
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-top">
              <CircleHelp size={18} />
              <span>Strictly Educational</span>
            </div>
            <p>Simulated virtual funds only. Zero real-money execution.</p>
            <button onClick={() => setDiagnosticOpen(true)}>
              Diagnostic Test <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="sidebar-foot">
            <span className="online-dot" />
            <span>Atlas Platform v1.0</span>
            <button onClick={() => setIsPublicLanding(true)} className="foot-portal-btn">
              Public Portal
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="mobile-backdrop" onClick={() => setMobileOpen(false)} />}

      {/* MAIN CONTENT AREA */}
      <div className="main-area">
        {/* Top Header Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <span className="breadcrumb">Atlas Academy</span>
            <ChevronRight size={14} className="breadcrumb-arrow" />
            <strong>
              {section === "trading-lab" && "Trading Replay Lab"}
              {section === "risk-lab" && "Risk Management Laboratory"}
              {section === "backtest" && "Strategy Backtest Arena"}
              {section === "monte-carlo" && "Monte Carlo Equity Simulator"}
              {section === "skill-universe" && "3D Skill Universe"}
              {section === "analytics" && "Learning Analytics Dashboard"}
              {section === "achievements" && "Achievement Gallery"}
              {section === "binary-lab" && "Binary Options Educational Lab"}
              {section === "revision" && "Daily Revision Queue"}
              {section === "coach" && "AI Learning Coach"}
              {section === "studio" && "Knowledge Studio"}
              {section === "progress" && "Skills & Performance Analytics"}
              {section === "academy" && (activeLessonId ? "Interactive Masterclass Episode" : "Masterclass Catalog")}
              {section === "dashboard" && "Adaptive Overview & Classes"}
              {section === "profile" && "Account & Settings"}
              {section === "journal" && "Trading Journal & Reflections"}
              {section === "legal" && "Legal & Compliance"}
            </strong>
          </div>

          <div className="topbar-right">
            {/* Quick Diagnostic Assessment Trigger */}
            <button
              onClick={() => setDiagnosticOpen(true)}
              className="topbar-diagnostic-btn"
              title="Take Diagnostic Placement"
            >
              <Compass size={16} />
              <span>Diagnostic</span>
            </button>

            {/* Quick Virtual Balance Display */}
            <div className="topbar-balance-pill" title="Virtual Account Balance">
              <DollarSign size={14} />
              <strong>${virtualBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              <button onClick={resetVirtualBalance} title="Reset to $10,000" className="balance-reset-btn">
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Search Input */}
            <div className="top-search">
              <Search size={17} />
              <input
                aria-label="Search lessons"
                placeholder="Search classes..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  if (e.target.value) setSection("academy");
                }}
              />
              <span>⌘ K</span>
            </div>

            <div className="topbar-divider" />

            {/* User Profile / Sign In */}
            {user ? (
              <button className="profile-button" onClick={() => navigateTo("profile")}>
                <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="profile-name">{user.name.split(" ")[0]}</span>
                <ChevronDown size={15} />
              </button>
            ) : (
              <button
                className="sign-in-button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                Sign In <ArrowRight size={15} />
              </button>
            )}
          </div>
        </header>

        {/* Real-time Market Pulse & Community Activity Ribbon */}
        <LiveMarketTicker />

        {toastNotice && (
          <div className="toast" role="status">
            <span>{toastNotice}</span>
            <button onClick={() => setToastNotice("")}><X size={15} /></button>
          </div>
        )}

        {/* WORKSPACE SECTIONS ROUTING */}
        <main className="content">
          {/* 1. OVERVIEW & NETFLIX-STYLE MASTERCLASSES DASHBOARD */}
          {section === "dashboard" && (
            <div className="netflix-dashboard-container">
              {/* NEXT STEPS PANEL — shown for logged-in users who haven't completed onboarding/diagnostic/first lesson */}
              {user && completedCount === 0 && (
                <NextStepsPanel
                  hasCompletedOnboarding={!!user.onboardingCompleted}
                  hasTakenDiagnostic={false}
                  completedLessonsCount={completedCount}
                  onTakeDiagnostic={() => setDiagnosticOpen(true)}
                  onCompleteOnboarding={() => navigateTo("onboarding")}
                  onStartFirstLesson={() => openLesson(featuredClass.firstLessonId)}
                  onVisitRiskLab={() => navigateTo("risk-lab")}
                />
              )}

              {/* LEARNING PATH ROADMAP — visible for ALL users (guests included) */}
              <LearningPathRoadmap
                lessons={lessons}
                completedLessonIds={completed}
                onOpenLesson={openLesson}
                isAuthenticated={!!user}
              />
              {/* IMMERSIVE NETFLIX FEATURED HERO BANNER */}
              <div className="netflix-hero-spotlight">
                <div className="spotlight-backdrop-vignette" />
                <div className="spotlight-glow-lights" />

                <div className="spotlight-content-area">
                  <div className="spotlight-tag-row">
                    <span className="spotlight-top-badge">
                      <Flame size={12} fill="currentColor" /> #1 IN FINANCIAL EDUCATION TODAY
                    </span>
                    <span className="spotlight-origin-badge">ATLAS ORIGINAL MASTERCLASS</span>
                  </div>

                  <h1 className="spotlight-title">{featuredClass.title}</h1>
                  <p className="spotlight-tagline">{featuredClass.tagline}</p>

                  <div className="spotlight-specs-row">
                    <span className="spotlight-match">99% Match for You</span>
                    <span className="spotlight-season">{featuredClass.seasonTag}</span>
                    <span className="spotlight-rating"><Star size={13} fill="#ffd43b" color="#ffd43b" /> 4.95 ★</span>
                    <span className="spotlight-quality">{featuredClass.qualityBadge}</span>
                  </div>

                  <div className="spotlight-actions-row">
                    <button
                      onClick={() => openLesson(featuredClass.firstLessonId)}
                      className="spotlight-play-btn"
                    >
                      <Play size={18} fill="currentColor" />
                      <span>{completedCount > 0 ? "Resume Learning" : "Start Masterclass"}</span>
                    </button>

                    <button
                      onClick={() => setSelectedMasterclass(featuredClass)}
                      className="spotlight-info-btn"
                    >
                      <CircleHelp size={18} />
                      <span>Class Overview & Episodes</span>
                    </button>

                    <button
                      onClick={() => toggleSaveClass(featuredClass.id)}
                      className={`spotlight-list-btn ${savedClassIds.includes(featuredClass.id) ? "saved" : ""}`}
                    >
                      {savedClassIds.includes(featuredClass.id) ? <Check size={18} /> : <Plus size={18} />}
                      <span>{savedClassIds.includes(featuredClass.id) ? "In My List" : "Add to My List"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* NETFLIX CATEGORY FILTER TABS */}
              <div className="netflix-filter-pills-bar">
                {[
                  "All",
                  "Top 10",
                  "Forex Foundations",
                  "Risk Management",
                  "Technical Analysis",
                  "Binary Options",
                  "Trading Psychology",
                  "My List"
                ].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`filter-pill-btn ${selectedCategoryFilter === cat ? "active" : ""}`}
                  >
                    {cat === "Top 10" && <Flame size={12} className="text-amber-400 mr-1" />}
                    {cat === "My List" && <ListPlus size={12} className="text-emerald-400 mr-1" />}
                    <span>{cat}</span>
                  </button>
                ))}
              </div>

              {/* NETFLIX-STYLE HORIZONTAL CLASS RAILS */}
              <div className="netflix-rails-container">
                {/* RAIL 1: CONTINUE LEARNING (If in progress) */}
                {completedCount > 0 && (
                  <section className="netflix-rail-section">
                    <div className="rail-header-row">
                      <div className="rail-title-group">
                        <span className="rail-kicker">PICK UP WHERE YOU LEFT OFF</span>
                        <h3>Continue Learning & Practising</h3>
                      </div>
                      <span className="rail-count">{completedCount} Lessons Completed</span>
                    </div>

                    <div className="netflix-cards-horizontal-scroll">
                      {MASTERCLASSES_CATALOG.filter(c => {
                        const classLessons = lessons.filter(l => l.pathId === c.pathId);
                        return classLessons.some(l => completed.includes(l.id));
                      }).map(mc => (
                        <NetflixCard
                          key={mc.id}
                          masterclass={mc}
                          completedLessons={completed}
                          allLessons={lessons}
                          onPlay={(lId) => openLesson(lId)}
                          onOpenDetails={(item) => setSelectedMasterclass(item)}
                          isSaved={savedClassIds.includes(mc.id)}
                          onToggleSaved={toggleSaveClass}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* RAIL 2: TOP 10 CLASSES IN TRADING ACADEMY TODAY */}
                <section className="netflix-rail-section">
                  <div className="rail-header-row">
                    <div className="rail-title-group">
                      <span className="rail-kicker">TOP RANKED</span>
                      <h3>Top 10 Classes in Trading Academy Today</h3>
                    </div>
                    <span className="rail-badge-top10"><Flame size={12} /> POPULAR</span>
                  </div>

                  <div className="netflix-cards-horizontal-scroll">
                    {MASTERCLASSES_CATALOG.filter(c => c.top10Rank).map(mc => (
                      <NetflixCard
                        key={mc.id}
                        masterclass={mc}
                        rankNumber={mc.top10Rank}
                        completedLessons={completed}
                        allLessons={lessons}
                        onPlay={(lId) => openLesson(lId)}
                        onOpenDetails={(item) => setSelectedMasterclass(item)}
                        isSaved={savedClassIds.includes(mc.id)}
                        onToggleSaved={toggleSaveClass}
                      />
                    ))}
                  </div>
                </section>

                {/* RAIL 3: CAPITAL DEFENSE & RISK LABS */}
                <section className="netflix-rail-section">
                  <div className="rail-header-row">
                    <div className="rail-title-group">
                      <span className="rail-kicker">ESSENTIAL DEFENSE</span>
                      <h3>Risk Management & Capital Defense Masterclasses</h3>
                    </div>
                    <button className="rail-view-all-btn" onClick={() => navigateTo("risk-lab")}>
                      Open Risk Lab <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="netflix-cards-horizontal-scroll">
                    {MASTERCLASSES_CATALOG.filter(c => c.category === "Risk Management").map(mc => (
                      <NetflixCard
                        key={mc.id}
                        masterclass={mc}
                        completedLessons={completed}
                        allLessons={lessons}
                        onPlay={(lId) => openLesson(lId)}
                        onOpenDetails={(item) => setSelectedMasterclass(item)}
                        isSaved={savedClassIds.includes(mc.id)}
                        onToggleSaved={toggleSaveClass}
                      />
                    ))}
                  </div>
                </section>

                {/* RAIL 4: MARKET STRUCTURE & CANDLESTICKS */}
                <section className="netflix-rail-section">
                  <div className="rail-header-row">
                    <div className="rail-title-group">
                      <span className="rail-kicker">VISUAL PRICE ACTION</span>
                      <h3>Market Structure & Candlestick Deep Dives</h3>
                    </div>
                    <button className="rail-view-all-btn" onClick={() => navigateTo("trading-lab")}>
                      Open Replay Lab <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="netflix-cards-horizontal-scroll">
                    {MASTERCLASSES_CATALOG.filter(c => c.category === "Technical Analysis" || c.category === "Forex Foundations").map(mc => (
                      <NetflixCard
                        key={mc.id}
                        masterclass={mc}
                        completedLessons={completed}
                        allLessons={lessons}
                        onPlay={(lId) => openLesson(lId)}
                        onOpenDetails={(item) => setSelectedMasterclass(item)}
                        isSaved={savedClassIds.includes(mc.id)}
                        onToggleSaved={toggleSaveClass}
                      />
                    ))}
                  </div>
                </section>

                {/* RAIL 5: EXPOSING BINARY OPTIONS */}
                <section className="netflix-rail-section">
                  <div className="rail-header-row">
                    <div className="rail-title-group">
                      <span className="rail-kicker">MATHEMATICAL TRUTHS</span>
                      <h3>Exposing Binary Options: Expected Value & Broker Edge</h3>
                    </div>
                    <button className="rail-view-all-btn" onClick={() => navigateTo("binary-lab")}>
                      Open Binary Lab <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="netflix-cards-horizontal-scroll">
                    {MASTERCLASSES_CATALOG.filter(c => c.category === "Binary Options").map(mc => (
                      <NetflixCard
                        key={mc.id}
                        masterclass={mc}
                        completedLessons={completed}
                        allLessons={lessons}
                        onPlay={(lId) => openLesson(lId)}
                        onOpenDetails={(item) => setSelectedMasterclass(item)}
                        isSaved={savedClassIds.includes(mc.id)}
                        onToggleSaved={toggleSaveClass}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* 2. ACADEMY & INTERACTIVE LESSON PLAYER */}
          {section === "academy" && (
            currentLesson ? (
              /* FULL INTERACTIVE LESSON / MASTERCLASS PLAYER */
              <InteractiveLessonPlayer
                lesson={currentLesson}
                allLessons={lessons}
                completedLessons={completed}
                onCompleteLesson={handleLessonAssessment}
                onSelectLesson={openLesson}
                onBackToClasses={() => setActiveLessonId(null)}
                userXp={experiencePoints}
              />
            ) : (
              /* ACADEMY CATALOG VIEW */
              <div className="academy-catalog-page">
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">
                      <span className="eyebrow-line" /> STRUCTURED CURRICULUM
                    </div>
                    <h1>Masterclasses & Curriculum Pathways<span className="title-dot">.</span></h1>
                    <p>Select any class card to preview episodes, study key principles, and engage in interactive candlestick scenarios.</p>
                  </div>
                </div>

                <div className="netflix-cards-grid">
                  {filteredMasterclasses.map(mc => (
                    <NetflixCard
                      key={mc.id}
                      masterclass={mc}
                      completedLessons={completed}
                      allLessons={lessons}
                      onPlay={(lId) => openLesson(lId)}
                      onOpenDetails={(item) => setSelectedMasterclass(item)}
                      isSaved={savedClassIds.includes(mc.id)}
                      onToggleSaved={toggleSaveClass}
                    />
                  ))}
                </div>
              </div>
            )
          )}

          {/* 3. TRADING REPLAY LAB */}
          {section === "trading-lab" && (
            <TradingLab
              user={user ? { ...user, virtualBalance } : null}
              onTradeCompleted={() => {
                setExperiencePoints(xp => xp + 25);
              }}
            />
          )}

          {/* 4. RISK MANAGEMENT LABORATORY */}
          {section === "risk-lab" && <RiskLaboratory />}

          {/* 4b. STRATEGY BACKTEST ARENA */}
          {section === "backtest" && <BacktestArena />}

          {/* 4c. MONTE CARLO EQUITY SIMULATOR */}
          {section === "monte-carlo" && <MonteCarloEquity />}

          {/* 4d. 3D SKILL UNIVERSE */}
          {section === "skill-universe" && (
            <SkillUniverse3D
              completedLessonIds={completed}
              lessons={lessons.map(l => ({ id: l.id, skillIds: l.skillIds }))}
            />
          )}

          {/* 4e. LEARNING ANALYTICS DASHBOARD */}
          {section === "analytics" && (
            <LearningAnalyticsDashboard
              user={user ? { id: user.id, experiencePoints, streakDays: user.persona ? 1 : 1, persona: user.persona } : null}
            />
          )}

          {/* 4e-bis. ACHIEVEMENT GALLERY */}
          {section === "achievements" && (
            <AchievementsGallery user={user ? { id: user.id } : null} />
          )}

          {/* 4f. ADAPTIVE ONBOARDING (if user hasn't completed it) */}
          {section === "onboarding" && user && (
            <AdaptiveOnboarding
              onComplete={async (profile) => {
                try {
                  await fetch("/api/onboarding", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(profile),
                  });
                  setExperiencePoints(xp => xp + 25);
                  navigateTo("dashboard");
                } catch {}
              }}
            />
          )}

          {/* 5. BINARY OPTIONS EDUCATIONAL LAB */}
          {section === "binary-lab" && (
            <BinaryOptionsLab
              user={user ? { ...user, virtualBalance } : null}
              onTradeCompleted={() => {
                setExperiencePoints(xp => xp + 20);
              }}
            />
          )}

          {/* 6. DAILY REVISION QUEUE (SPACED REPETITION) */}
          {section === "revision" && <RevisionDeck />}

          {/* 7. AI LEARNING COACH */}
          {section === "coach" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" /> AI LEARNING COACH
                  </div>
                  <h1>Your Contextual Study Partner<span className="title-dot">.</span></h1>
                  <p>Ask questions about terminology, risk mathematics, or trade post-mortems grounded in verified Academy material.</p>
                </div>
                <div className="heading-symbol">
                  <Sparkles size={30} />
                </div>
              </div>

              <div className="coach-layout">
                <div className="coach-chat">
                  <div className="coach-chat-head">
                    <div className="coach-avatar">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <strong>Atlas Learning Coach</strong>
                      <span><span className="online-dot" /> Verified Knowledge Retrieval</span>
                    </div>
                    <div className="coach-head-note">APPROVED LESSONS ONLY</div>
                  </div>

                  <div className="coach-chat-body">
                    {coachHistory.map((item, i) => (
                      <div key={i}>
                        <div className="user-message">
                          <div>{item.question}</div>
                        </div>

                        <div className="coach-message">
                          <div className="coach-msg-icon">
                            <Sparkles size={16} />
                          </div>
                          <div className="coach-bubble">
                            <div style={{ whiteSpace: "pre-line" }}>{item.answer}</div>
                            {item.related && item.related.length > 0 && (
                              <div className="coach-related-links">
                                <span>Suggested Lessons:</span>
                                {item.related.map(r => (
                                  <button key={r.id} onClick={() => openLesson(r.id)}>
                                    <BookOpen size={13} /> {r.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {coachBusy && (
                      <div className="coach-message">
                        <div className="coach-msg-icon">
                          <Sparkles size={16} />
                        </div>
                        <div className="coach-bubble">
                          <em>Formulating verified explanation...</em>
                        </div>
                      </div>
                    )}
                  </div>

                  <form className="coach-input" onSubmit={handleAskCoach}>
                    <input
                      value={coachInput}
                      onChange={e => setCoachInput(e.target.value)}
                      placeholder="Ask about pips, lot sizing formulas, drawdowns, or binary options..."
                      aria-label="Ask Coach"
                    />
                    <button disabled={!coachInput.trim() || coachBusy} aria-label="Send">
                      <Send size={18} />
                    </button>
                  </form>

                  <div className="coach-disclaimer">
                    Educational explanations only. No real-time price predictions or personalized financial advice.
                  </div>
                </div>

                <div className="coach-prompts">
                  <div className="eyebrow small">COMMON INQUIRIES</div>
                  <h3>Suggested Topics</h3>
                  {[
                    "How do I calculate position size from my stop distance?",
                    "Why does an 80% payout binary option have negative EV?",
                    "Explain the difference between Market, Limit and Stop orders",
                    "Why is a 50% drawdown so difficult to recover from?"
                  ].map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setCoachInput(prompt);
                      }}
                    >
                      <span><Lightbulb size={16} />{prompt}</span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}

                  <div className="coach-note">
                    <ShieldCheck size={18} />
                    <p>All explanations are retrieved from verified lesson specifications and risk management mathematics.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 8. SKILLS & PERFORMANCE ANALYTICS */}
          {section === "progress" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" /> DEMONSTRATED EVIDENCE
                  </div>
                  <h1>Skill Map & Progression Analytics<span className="title-dot">.</span></h1>
                  <p>Transparent evidence across six skill mastery states: Not Started, Learning, Developing, Practising, Demonstrated, and Needs Revision.</p>
                </div>
                <div className="heading-symbol">
                  <TrendingUp size={30} />
                </div>
              </div>

              {/* Progress Summary Banner */}
              <div className="progress-banner">
                <div>
                  <span>CURRICULUM MASTERY GAUGE</span>
                  <h2>{completedCount} of {lessons.length} Modules Demonstrated</h2>
                  <p>Overall Level {Math.floor(experiencePoints / 100) + 1} ({experiencePoints} Total XP)</p>
                </div>
                <strong>{progressPercent}%</strong>
                <div className="progress-banner-bar">
                  <div style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {/* 6-State Skill Mastery Grid */}
              <div className="section-title-row">
                <div>
                  <div className="eyebrow small">SKILLS TAXONOMY</div>
                  <h3>Individual Skill Mastery States</h3>
                </div>
              </div>

              <div className="skill-grid">
                {SKILLS_TAXONOMY.map(skill => {
                  const associatedLesson = lessons.find(l => l.skillIds.includes(skill.id));
                  const isDone = associatedLesson && completed.includes(associatedLesson.id);
                  const isUnlockedSkill = associatedLesson && isUnlocked(associatedLesson, completed);

                  const state = isDone ? "Demonstrated" : isUnlockedSkill ? "Developing" : "Not Started";

                  return (
                    <div
                      key={skill.id}
                      className={`skill-card ${isDone ? "skill-done" : ""}`}
                    >
                      <div className="skill-top">
                        <span>{skill.code}</span>
                        {isDone ? (
                          <CheckCircle2 size={21} className="icon-demonstrated" />
                        ) : isUnlockedSkill ? (
                          <Circle size={20} className="icon-developing" />
                        ) : (
                          <LockKeyhole size={18} className="icon-locked" />
                        )}
                      </div>

                      <h4>{skill.name}</h4>
                      <p>{skill.description}</p>

                      <div className="skill-bottom-row">
                        <span className={`skill-status-pill ${state.toLowerCase().replace(" ", "-")}`}>
                          {state.toUpperCase()}
                        </span>
                        {associatedLesson && (
                          <button
                            onClick={() => openLesson(associatedLesson.id)}
                            className="skill-goto-btn"
                          >
                            Study Lesson <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 9. ADMIN KNOWLEDGE STUDIO */}
          {section === "studio" && (
            isAdmin ? (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">
                      <span className="eyebrow-line" /> CONTENT AUTHORING
                    </div>
                    <h1>Knowledge Studio<span className="title-dot">.</span></h1>
                    <p>Draft, validate, and publish new courses, chapters, and assessment quizzes without code redeployments.</p>
                  </div>
                  <button className="primary-button" onClick={() => setStudioModalOpen(true)}>
                    <Plus size={17} /> Author New Lesson Draft
                  </button>
                </div>

                <div className="studio-hero">
                  <div>
                    <span>AUTHORING PIPELINE</span>
                    <h2>Evolve The Academy With New Content</h2>
                    <p>
                      Created modules automatically integrate into the curriculum hierarchy, evaluate prerequisites, and distribute to eligible learners.
                    </p>
                  </div>
                  <FileText size={80} strokeWidth={1} />
                </div>

                <div className="section-title-row">
                  <div>
                    <div className="eyebrow small">DATABASE REPOSITORY</div>
                    <h3>Authored Curriculum Drafts</h3>
                  </div>
                  <span className="chapter-count">{draftsList.length} Lessons</span>
                </div>

                {draftsList.length > 0 ? (
                  <div className="studio-list">
                    {draftsList.map(item => (
                      <div className="studio-row" key={item.id}>
                        <div className="studio-row-icon">
                          <FileText size={21} />
                        </div>
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.category} · Status: {item.status.toUpperCase()} · v{item.version}</span>
                        </div>
                        {item.status === "draft" && user?.role !== "editor" ? (
                          <button onClick={() => publishLesson(item.id)}>
                            Publish To Academy <ArrowRight size={15} />
                          </button>
                        ) : (
                          <span className="published-label">
                            <CheckCircle2 size={16} /> Published Live
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    No custom drafts in database yet. Click “Author New Lesson Draft” above to create your first dynamic module.
                  </div>
                )}

                {/* Studio Authoring Modal */}
                {studioModalOpen && (
                  <div className="modal-backdrop" onClick={() => setStudioModalOpen(false)}>
                    <div className="studio-modal" onClick={e => e.stopPropagation()}>
                      <button className="modal-close" onClick={() => setStudioModalOpen(false)}>
                        <X size={20} />
                      </button>

                      <div className="eyebrow small">NEW CURRICULUM MODULE</div>
                      <h2>Author Lesson & Verification Assessment</h2>
                      <p>Drafts are private until validated and published.</p>

                      <form onSubmit={handleSaveDraft} className="studio-form">
                        <div className="form-two">
                          <label>
                            Lesson Title:
                            <input name="title" required placeholder="e.g. Managing Overnight Financing & Swaps" />
                          </label>
                          <label>
                            Learning Path:
                            <select name="pathId" defaultValue="forex-foundations">
                              {LEARNING_PATHS.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="form-two">
                          <label>
                            Category:
                            <input name="category" required defaultValue="Forex foundations" />
                          </label>
                          <label>
                            Level:
                            <select name="level" defaultValue="Beginner">
                              <option value="Beginner">Beginner</option>
                              <option value="Developing">Developing</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          </label>
                        </div>

                        <label>
                          Short Description:
                          <input name="description" required placeholder="What concept will the learner understand?" />
                        </label>

                        <div className="form-two">
                          <label>
                            Estimated Read Minutes:
                            <input name="duration" type="number" min="1" max="60" defaultValue="8" required />
                          </label>
                          <label>
                            Prerequisite Lesson:
                            <select name="prerequisiteId">
                              <option value="">None (Open to all learners)</option>
                              {lessons.map(l => (
                                <option key={l.id} value={l.id}>{l.title}</option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <label>
                          Lesson Content (Paragraphs):
                          <textarea
                            name="content"
                            required
                            rows={6}
                            placeholder="Write comprehensive educational content. Separate paragraphs with double newlines."
                          />
                        </label>

                        <label>
                          Core Takeaway Sentence:
                          <input name="takeaway" required placeholder="One memorable sentence summary." />
                        </label>

                        <label>
                          Assessment Verification Question:
                          <input name="question" required placeholder="A clear multiple choice question." />
                        </label>

                        <div className="form-two">
                          {[0, 1, 2, 3].map(i => (
                            <label key={i}>
                              Option {String.fromCharCode(65 + i)}:
                              <input name={`option${i}`} required placeholder={`Answer option ${i + 1}`} />
                            </label>
                          ))}
                        </div>

                        <div className="form-two">
                          <label>
                            Correct Answer:
                            <select name="answer" defaultValue="0">
                              {[0, 1, 2, 3].map(i => (
                                <option key={i} value={i}>Option {String.fromCharCode(65 + i)}</option>
                              ))}
                            </select>
                          </label>

                          <label>
                            Answer Explanation Rationale:
                            <input name="explanation" required placeholder="Why is this answer correct?" />
                          </label>
                        </div>

                        {studioError && <div className="form-error">{studioError}</div>}

                        <button className="primary-button" disabled={studioBusy}>
                          {studioBusy ? "Saving Draft..." : "Save Draft To Database"}
                          <ArrowRight size={17} />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="restricted">
                <LockKeyhole size={32} />
                <h2>Administrator Access Required</h2>
                <p>The Knowledge Studio is reserved for platform editors and owners.</p>
                <button className="primary-button" onClick={() => navigateTo("dashboard")}>
                  Return to Dashboard
                </button>
              </div>
            )
          )}

          {/* 9b. TRADING JOURNAL */}
          {section === "journal" && (
            <TradingJournal user={user ? { id: user.id } : null} />
          )}

          {/* 9c. LEGAL & COMPLIANCE HUB */}
          {section === "legal" && <LegalHub />}

          {/* 10. PROFILE & SETTINGS */}
          {section === "profile" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" /> LEARNER PROFILE
                  </div>
                  <h1>Account & Preferences<span className="title-dot">.</span></h1>
                  <p>Manage your virtual account balance, persona calibration, and learning credentials.</p>
                </div>
              </div>

              <div className="profile-card">
                <div className="profile-large-avatar">
                  {user?.name.charAt(0).toUpperCase() || "G"}
                </div>
                <div>
                  <h2>{user?.name || "Guest Explorer"}</h2>
                  <p>{user?.email || "Exploring via local browser session"}</p>
                  <span>Role: {user?.role.toUpperCase() || "LEARNER"} · Persona: {activePersona.toUpperCase()}</span>
                </div>
              </div>

              {/* Persona Switcher Box */}
              <div className="persona-settings-box">
                <h4>Calibrate Learner Persona:</h4>
                <div className="persona-buttons-row">
                  <button
                    onClick={() => switchPersona("beginner")}
                    className={`persona-btn ${activePersona === "beginner" ? "active" : ""}`}
                  >
                    Persona A: Beginner
                  </button>
                  <button
                    onClick={() => switchPersona("developing")}
                    className={`persona-btn ${activePersona === "developing" ? "active" : ""}`}
                  >
                    Persona B: Developing
                  </button>
                  <button
                    onClick={() => switchPersona("advanced")}
                    className={`persona-btn ${activePersona === "advanced" ? "active" : ""}`}
                  >
                    Persona C: Advanced
                  </button>
                </div>
              </div>

              {/* Virtual Balance Controls */}
              <div className="profile-actions">
                <div>
                  <strong>Virtual Account Funds ($10,000 Starting)</strong>
                  <p>Current balance: ${virtualBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
                <button onClick={resetVirtualBalance} className="reset-action-btn">
                  <RotateCcw size={16} /> Reset Balance to $10,000
                </button>
              </div>

              <div className="profile-actions">
                {user ? (
                  <>
                    <div>
                      <strong>Account Persistence</strong>
                      <p>Your lesson completions and simulated trades are stored in PostgreSQL.</p>
                    </div>
                    <button onClick={handleLogout}>
                      <LogOut size={17} /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <strong>Save Progress Across Devices</strong>
                      <p>Create a free account to sync progress and unlock administrative capabilities.</p>
                    </div>
                    <button onClick={() => { setAuthMode("register"); setAuthOpen(true); }}>
                      Create Account <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </main>

        {/* Global Footer */}
        <footer className="app-footer">
          <span>© 2026 Atlas Academy</span>
          <span>Education first. Virtual examples only. Strictly not financial advice.</span>
          <span>Adaptive Progression Platform v1.0</span>
        </footer>
      </div>

      {/* NETFLIX-STYLE CLASS DETAIL PREVIEW MODAL */}
      <ClassDetailModal
        masterclass={selectedMasterclass}
        isOpen={!!selectedMasterclass}
        onClose={() => setSelectedMasterclass(null)}
        onPlayLesson={(lessonId) => openLesson(lessonId)}
        onLaunchLab={(labType) => navigateTo(labType)}
        completedLessons={completed}
        allLessons={lessons}
        isSaved={selectedMasterclass ? savedClassIds.includes(selectedMasterclass.id) : false}
        onToggleSaved={toggleSaveClass}
      />

      {/* Guest Mode Floating Banner */}
      {!user && (
        <div className="guest-banner">
          <div>
            <span className="guest-banner-icon"><Sparkles size={16} /></span>
            <strong>Exploring as a Guest</strong>
            <span> — Create a free account to sync your verified skill mastery.</span>
          </div>
          <button onClick={() => { setAuthMode("register"); setAuthOpen(true); }}>
            Create Free Account <ArrowRight size={15} />
          </button>
          <button className="guest-close" onClick={e => (e.currentTarget.parentElement!.style.display = "none")} aria-label="Dismiss">
            <X size={17} />
          </button>
        </div>
      )}

      {/* Diagnostic Placement Modal */}
      <DiagnosticModal
        isOpen={diagnosticOpen}
        onClose={() => setDiagnosticOpen(false)}
        onCompleted={(level) => {
          setActivePersona(level.toLowerCase());
          setToastNotice(`Diagnostic complete: Calibrated to Persona Level ${level}!`);
          setTimeout(() => setToastNotice(""), 4000);
        }}
      />

      {/* Authentication Modal */}
      {authOpen && (
        <div className="modal-backdrop" onClick={() => setAuthOpen(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Close">
              <X size={20} />
            </button>

            <div className="auth-logo">
              <div className="brand-mark"><span>◆</span></div>
              <span>atlas<span>.</span></span>
            </div>

            <div className="eyebrow small">AUTHENTICATED WORKSPACE</div>
            <h2>{authMode === "register" ? "Create Free Academy Account" : "Welcome Back"}</h2>
            <p>{authMode === "register" ? "Track demonstrated skills and virtual trading history." : "Sign in to pick up right where you left off."}</p>

            <form onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <label>
                  Full Name:
                  <input name="name" required minLength={2} placeholder="Jordan Smith" autoComplete="name" />
                </label>
              )}
              <label>
                Email Address:
                <input name="email" required type="email" placeholder="learner@example.com" autoComplete="email" />
              </label>
              <label>
                Password:
                <input name="password" required type="password" minLength={8} placeholder="Minimum 8 characters" autoComplete={authMode === "login" ? "current-password" : "new-password"} />
              </label>

              {authError && <div className="form-error">{authError}</div>}

              <button className="primary-button" disabled={authBusy}>
                {authBusy ? "Authenticating..." : authMode === "register" ? "Create Account" : "Sign In"}
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="auth-switch">
              {authMode === "register" ? "Already have an account?" : "New to Atlas?"}{" "}
              <button onClick={() => { setAuthError(""); setAuthMode(authMode === "register" ? "login" : "register"); }}>
                {authMode === "register" ? "Sign In" : "Register"}
              </button>
            </div>

            <div className="auth-foot">
              <ShieldCheck size={15} /> Educational Platform · Zero Real-Money Deposits
            </div>
          </div>
        </div>
      )}

      {/* GUIDED WELCOME — shown once for ALL first-time visitors (guests included) */}
      {!guidedWelcomeSeen && !authOpen && !diagnosticOpen && section === "dashboard" && (
        <GuidedWelcome
          userName={user?.name}
          onComplete={() => {
            setGuidedWelcomeSeen(true);
            try { localStorage.setItem("atlas_guided_welcome_seen", "1"); } catch {}
            // Only auto-open diagnostic for authenticated users — guests can't submit it
            if (user) {
              setDiagnosticOpen(true);
            } else {
              // For guests, prompt to register so they can save progress
              setAuthOpen(true);
              setAuthMode("register");
            }
          }}
          onSkip={() => {
            setGuidedWelcomeSeen(true);
            try { localStorage.setItem("atlas_guided_welcome_seen", "1"); } catch {}
          }}
        />
      )}
    </div>
  );
}
