// Achievement catalog + evaluation engine.
// Shared between API routes (achievements, assessments, diagnostic, simulation flows).

import { db } from "@/db";
import { writeJson, readJson } from "@/db/schema";
import { randomUUID } from "node:crypto";

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";
export type AchievementCategory =
  | "learning"
  | "discipline"
  | "simulation"
  | "streak"
  | "mastery"
  | "special";

export type AchievementCriteria =
  | { type: "lessons_completed"; threshold: number }
  | { type: "xp_threshold"; threshold: number }
  | { type: "streak_days"; threshold: number }
  | { type: "skills_demonstrated"; threshold: number }
  | { type: "sim_trades"; threshold: number }
  | { type: "process_score_avg"; threshold: number }
  | { type: "binary_sims"; threshold: number }
  | { type: "backtests_run"; threshold: number }
  | { type: "diagnostic_advanced"; threshold: 1 }
  | { type: "onboarding_complete"; threshold: 1 }
  | { type: "risk_lab_used"; threshold: 1 };

export type AchievementDef = {
  id: string;
  code: string;
  name: string;
  description: string;
  category: AchievementCategory;
  iconKey: string;
  tier: AchievementTier;
  xpReward: number;
  criteria: AchievementCriteria;
};

// The full achievement catalog — 24 badges across 6 categories
export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  // === LEARNING (curriculum completion) ===
  {
    id: "ach-first-lesson",
    code: "FIRST_STEPS",
    name: "First Steps",
    description: "Complete your first lesson assessment",
    category: "learning",
    iconKey: "BookOpen",
    tier: "bronze",
    xpReward: 25,
    criteria: { type: "lessons_completed", threshold: 1 },
  },
  {
    id: "ach-5-lessons",
    code: "SCHOLAR",
    name: "Scholar",
    description: "Complete 5 lesson assessments",
    category: "learning",
    iconKey: "GraduationCap",
    tier: "bronze",
    xpReward: 75,
    criteria: { type: "lessons_completed", threshold: 5 },
  },
  {
    id: "ach-10-lessons",
    code: "CURRICULUM_DEVOTEE",
    name: "Curriculum Devotee",
    description: "Complete 10 lesson assessments",
    category: "learning",
    iconKey: "Library",
    tier: "silver",
    xpReward: 150,
    criteria: { type: "lessons_completed", threshold: 10 },
  },
  {
    id: "ach-all-lessons",
    code: "CURRICULUM_MASTER",
    name: "Curriculum Master",
    description: "Complete all available lessons",
    category: "learning",
    iconKey: "Crown",
    tier: "platinum",
    xpReward: 500,
    criteria: { type: "lessons_completed", threshold: 19 },
  },

  // === STREAK (consistency) ===
  {
    id: "ach-3-day-streak",
    code: "CONSISTENT",
    name: "Consistent",
    description: "Maintain a 3-day study streak",
    category: "streak",
    iconKey: "Flame",
    tier: "bronze",
    xpReward: 50,
    criteria: { type: "streak_days", threshold: 3 },
  },
  {
    id: "ach-7-day-streak",
    code: "WEEK_WARRIOR",
    name: "Week Warrior",
    description: "Maintain a 7-day study streak",
    category: "streak",
    iconKey: "Flame",
    tier: "silver",
    xpReward: 150,
    criteria: { type: "streak_days", threshold: 7 },
  },
  {
    id: "ach-30-day-streak",
    code: "UNBREAKABLE",
    name: "Unbreakable",
    description: "Maintain a 30-day study streak",
    category: "streak",
    iconKey: "Trophy",
    tier: "gold",
    xpReward: 500,
    criteria: { type: "streak_days", threshold: 30 },
  },

  // === MASTERY (skill demonstrations) ===
  {
    id: "ach-first-skill",
    code: "FIRST_MASTERY",
    name: "First Mastery",
    description: "Demonstrate your first trading skill",
    category: "mastery",
    iconKey: "Star",
    tier: "bronze",
    xpReward: 50,
    criteria: { type: "skills_demonstrated", threshold: 1 },
  },
  {
    id: "ach-3-skills",
    code: "SKILL_BUILDER",
    name: "Skill Builder",
    description: "Demonstrate 3 trading skills",
    category: "mastery",
    iconKey: "ShieldCheck",
    tier: "silver",
    xpReward: 150,
    criteria: { type: "skills_demonstrated", threshold: 3 },
  },
  {
    id: "ach-5-skills",
    code: "WELL_ROUNDED",
    name: "Well-Rounded",
    description: "Demonstrate 5 trading skills across multiple categories",
    category: "mastery",
    iconKey: "Medal",
    tier: "gold",
    xpReward: 300,
    criteria: { type: "skills_demonstrated", threshold: 5 },
  },
  {
    id: "ach-all-skills",
    code: "POLYMATH",
    name: "Polymath",
    description: "Demonstrate every skill in the taxonomy",
    category: "mastery",
    iconKey: "Crown",
    tier: "platinum",
    xpReward: 1000,
    criteria: { type: "skills_demonstrated", threshold: 9 },
  },

  // === SIMULATION (trading practice) ===
  {
    id: "ach-first-trade",
    code: "FIRST_POSITION",
    name: "First Position",
    description: "Place your first simulated trade in the Trading Lab",
    category: "simulation",
    iconKey: "TrendingUp",
    tier: "bronze",
    xpReward: 50,
    criteria: { type: "sim_trades", threshold: 1 },
  },
  {
    id: "ach-10-trades",
    code: "ACTIVE_TRADER",
    name: "Active Trader",
    description: "Place 10 simulated trades",
    category: "simulation",
    iconKey: "Activity",
    tier: "silver",
    xpReward: 150,
    criteria: { type: "sim_trades", threshold: 10 },
  },
  {
    id: "ach-50-trades",
    code: "MARKET_VETERAN",
    name: "Market Veteran",
    description: "Place 50 simulated trades",
    category: "simulation",
    iconKey: "Briefcase",
    tier: "gold",
    xpReward: 400,
    criteria: { type: "sim_trades", threshold: 50 },
  },

  // === DISCIPLINE (process quality, not PnL) ===
  {
    id: "ach-disciplined-1",
    code: "RISK_AWARE",
    name: "Risk Aware",
    description: "Place 5 trades with explicit Stop Loss protection",
    category: "discipline",
    iconKey: "ShieldCheck",
    tier: "bronze",
    xpReward: 75,
    criteria: { type: "process_score_avg", threshold: 70 },
  },
  {
    id: "ach-disciplined-2",
    code: "DISCIPLINED_EXECUTOR",
    name: "Disciplined Executor",
    description: "Maintain an average process score above 85%",
    category: "discipline",
    iconKey: "Target",
    tier: "gold",
    xpReward: 300,
    criteria: { type: "process_score_avg", threshold: 85 },
  },

  // === BINARY OPTIONS EDUCATION ===
  {
    id: "ach-binary-1",
    code: "PROBABILITY_EXPLORER",
    name: "Probability Explorer",
    description: "Run your first binary options educational simulation",
    category: "simulation",
    iconKey: "SplitSquareVertical",
    tier: "bronze",
    xpReward: 50,
    criteria: { type: "binary_sims", threshold: 1 },
  },
  {
    id: "ach-binary-10",
    code: "HOUSE_EDGE_WITNESS",
    name: "House Edge Witness",
    description: "Run 10 binary options simulations to witness the negative EV firsthand",
    category: "simulation",
    iconKey: "AlertTriangle",
    tier: "silver",
    xpReward: 150,
    criteria: { type: "binary_sims", threshold: 10 },
  },

  // === XP MILESTONES ===
  {
    id: "ach-100-xp",
    code: "RISING_STAR",
    name: "Rising Star",
    description: "Earn 100 total XP",
    category: "learning",
    iconKey: "Zap",
    tier: "bronze",
    xpReward: 0,
    criteria: { type: "xp_threshold", threshold: 100 },
  },
  {
    id: "ach-500-xp",
    code: "DEDICATED",
    name: "Dedicated",
    description: "Earn 500 total XP",
    category: "learning",
    iconKey: "Zap",
    tier: "silver",
    xpReward: 0,
    criteria: { type: "xp_threshold", threshold: 500 },
  },
  {
    id: "ach-2000-xp",
    code: "LUMINARY",
    name: "Luminary",
    description: "Earn 2,000 total XP",
    category: "learning",
    iconKey: "Sparkles",
    tier: "gold",
    xpReward: 0,
    criteria: { type: "xp_threshold", threshold: 2000 },
  },

  // === SPECIAL (one-time milestones) ===
  {
    id: "ach-onboarding",
    code: "ATLAS_INITIATE",
    name: "Atlas Initiate",
    description: "Complete adaptive onboarding",
    category: "special",
    iconKey: "Rocket",
    tier: "bronze",
    xpReward: 0, // XP already awarded by onboarding flow itself
    criteria: { type: "onboarding_complete", threshold: 1 },
  },
  {
    id: "ach-diagnostic-advanced",
    code: "PLACED_AHEAD",
    name: "Placed Ahead",
    description: "Score Advanced on the diagnostic assessment",
    category: "special",
    iconKey: "Compass",
    tier: "silver",
    xpReward: 100,
    criteria: { type: "diagnostic_advanced", threshold: 1 },
  },
  {
    id: "ach-risk-lab",
    code: "RISK_SCHOLAR",
    name: "Risk Scholar",
    description: "Use the Risk Laboratory — commitment to capital defense",
    category: "special",
    iconKey: "Calculator",
    tier: "bronze",
    xpReward: 50,
    criteria: { type: "risk_lab_used", threshold: 1 },
  },
];

// Seed the achievement catalog into the database (idempotent)
export async function seedAchievementCatalog() {
  for (const def of ACHIEVEMENT_CATALOG) {
    const existing = await db.achievement.findUnique({ where: { code: def.code } });
    if (!existing) {
      await db.achievement.create({
        data: {
          id: def.id,
          code: def.code,
          name: def.name,
          description: def.description,
          category: def.category,
          iconKey: def.iconKey,
          tier: def.tier,
          xpReward: def.xpReward,
          criteria: writeJson(def.criteria),
        },
      });
    } else {
      // Update name/description if changed
      await db.achievement.update({
        where: { id: existing.id },
        data: {
          name: def.name,
          description: def.description,
          iconKey: def.iconKey,
          tier: def.tier,
          xpReward: def.xpReward,
          criteria: writeJson(def.criteria),
        },
      });
    }
  }
}

// Compute current metric values for a user
type UserMetrics = {
  lessonsCompleted: number;
  xp: number;
  streakDays: number;
  skillsDemonstrated: number;
  simTrades: number;
  binarySims: number;
  avgProcessScore: number;
  onboardingComplete: boolean;
  diagnosticAdvanced: boolean;
  riskLabUsed: boolean;
};

export async function computeUserMetrics(userId: string): Promise<UserMetrics> {
  const [
    user,
    progress,
    skillMastery,
    simOrders,
    binarySims,
    diagnostic,
    riskLabVisit,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { experiencePoints: true, streakDays: true, onboardingCompleted: true },
    }),
    db.progress.findMany({ where: { userId, completed: true } }),
    db.learnerSkillMastery.findMany({ where: { userId, state: "demonstrated" } }),
    db.simOrder.findMany({ where: { userId }, select: { processScore: true } }),
    db.binarySim.findMany({ where: { userId }, select: { id: true } }),
    db.diagnosticAttempt.findFirst({
      where: { userId, assignedLevel: "Advanced" },
      select: { id: true },
    }),
    db.learningSession.findFirst({
      where: { userId, activityType: "simulation" },
      select: { id: true },
    }),
  ]);

  const simOrdersList = simOrders.filter(s => s.processScore !== null);
  const avgProcessScore = simOrdersList.length > 0
    ? simOrdersList.reduce((s, o) => s + (o.processScore || 0), 0) / simOrdersList.length
    : 0;

  return {
    lessonsCompleted: progress.length,
    xp: user?.experiencePoints || 0,
    streakDays: user?.streakDays || 1,
    skillsDemonstrated: skillMastery.length,
    simTrades: simOrders.length,
    binarySims: binarySims.length,
    avgProcessScore,
    onboardingComplete: user?.onboardingCompleted || false,
    diagnosticAdvanced: !!diagnostic,
    riskLabUsed: !!riskLabVisit,
  };
}

// Evaluate which achievements a user has unlocked but hasn't been awarded yet
export async function evaluateAndAwardAchievements(userId: string) {
  await seedAchievementCatalog();
  const metrics = await computeUserMetrics(userId);
  const allAchievements = await db.achievement.findMany();
  const unlocked = await db.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const unlockedIds = new Set(unlocked.map(u => u.achievementId));

  const newlyAwarded: { achievement: typeof allAchievements[number]; contextValue: number }[] = [];

  for (const ach of allAchievements) {
    if (unlockedIds.has(ach.id)) continue;
    const criteria = readJson<AchievementCriteria>(ach.criteria, { type: "xp_threshold", threshold: 0 });
    let value = 0;
    let met = false;

    switch (criteria.type) {
      case "lessons_completed":
        value = metrics.lessonsCompleted;
        met = value >= criteria.threshold;
        break;
      case "xp_threshold":
        value = metrics.xp;
        met = value >= criteria.threshold;
        break;
      case "streak_days":
        value = metrics.streakDays;
        met = value >= criteria.threshold;
        break;
      case "skills_demonstrated":
        value = metrics.skillsDemonstrated;
        met = value >= criteria.threshold;
        break;
      case "sim_trades":
        value = metrics.simTrades;
        met = value >= criteria.threshold;
        break;
      case "binary_sims":
        value = metrics.binarySims;
        met = value >= criteria.threshold;
        break;
      case "process_score_avg":
        value = metrics.avgProcessScore;
        met = value >= criteria.threshold && metrics.simTrades >= 3;
        break;
      case "onboarding_complete":
        met = metrics.onboardingComplete;
        value = 1;
        break;
      case "diagnostic_advanced":
        met = metrics.diagnosticAdvanced;
        value = 1;
        break;
      case "risk_lab_used":
        met = metrics.riskLabUsed;
        value = 1;
        break;
      default:
        met = false;
    }

    if (met) {
      await db.userAchievement.create({
        data: {
          id: randomUUID(),
          userId,
          achievementId: ach.id,
          contextData: writeJson({ value, metric: criteria.type }),
        },
      }).catch(() => {}); // race-safe: unique constraint may fire if concurrent

      // Award XP bonus if the achievement grants any
      if (ach.xpReward > 0) {
        await db.user.update({
          where: { id: userId },
          data: { experiencePoints: { increment: ach.xpReward } },
        }).catch(() => {});
      }

      newlyAwarded.push({ achievement: ach, contextValue: value });
    }
  }

  return newlyAwarded;
}

// Compute progress towards each achievement (for the gallery UI)
export type AchievementProgress = {
  def: AchievementDef;
  unlocked: boolean;
  unlockedAt: string | null;
  current: number;
  target: number;
  progressPct: number;
};

export async function getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
  await seedAchievementCatalog();
  const metrics = await computeUserMetrics(userId);
  const unlocks = await db.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, unlockedAt: true },
  });
  const unlockMap = new Map(unlocks.map(u => [u.achievementId, u.unlockedAt]));

  return ACHIEVEMENT_CATALOG.map(def => {
    const unlockedAt = unlockMap.get(def.id)?.toISOString() || null;
    let current = 0;
    switch (def.criteria.type) {
      case "lessons_completed": current = metrics.lessonsCompleted; break;
      case "xp_threshold": current = metrics.xp; break;
      case "streak_days": current = metrics.streakDays; break;
      case "skills_demonstrated": current = metrics.skillsDemonstrated; break;
      case "sim_trades": current = metrics.simTrades; break;
      case "binary_sims": current = metrics.binarySims; break;
      case "process_score_avg": current = Math.round(metrics.avgProcessScore); break;
      case "onboarding_complete": current = metrics.onboardingComplete ? 1 : 0; break;
      case "diagnostic_advanced": current = metrics.diagnosticAdvanced ? 1 : 0; break;
      case "risk_lab_used": current = metrics.riskLabUsed ? 1 : 0; break;
    }
    const target = def.criteria.threshold;
    const progressPct = Math.min(100, Math.round((current / target) * 100));
    return {
      def,
      unlocked: !!unlockedAt,
      unlockedAt,
      current: Math.min(current, target),
      target,
      progressPct,
    };
  });
}
