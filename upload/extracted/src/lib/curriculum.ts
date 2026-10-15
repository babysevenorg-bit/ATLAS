export type Question = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string;
  pathId: "forex-foundations" | "technical-analysis" | "risk-management" | "trading-psychology" | "binary-options";
  category: string;
  level: "Beginner" | "Developing" | "Advanced";
  duration: number; // in minutes
  order: number;
  content: string;
  takeaway: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  questionsList?: Question[];
  prerequisiteId: string | null;
  skillIds: string[];
  status: "published" | "draft" | "archived";
  version: number;
};

export type MasterclassEpisode = {
  id: string;
  episodeNumber: number;
  title: string;
  duration: number; // in mins
  description: string;
  isCompleted?: boolean;
  isUnlocked?: boolean;
  lessonId: string;
  thumbnailBadge?: string;
};

export type Masterclass = {
  id: string;
  title: string;
  tagline: string;
  category: "Forex Foundations" | "Technical Analysis" | "Risk Management" | "Trading Psychology" | "Binary Options";
  pathId: "forex-foundations" | "technical-analysis" | "risk-management" | "trading-psychology" | "binary-options";
  seasonTag: string;
  matchScore: number; // e.g. 98%
  rating: number; // e.g. 4.9
  qualityBadge: string; // e.g. "4K · INTERACTIVE LAB"
  level: "Beginner" | "Developing" | "Advanced";
  durationTotal: string;
  episodeCount: number;
  top10Rank?: number;
  badge?: "TOP 10" | "TRENDING" | "MUST WATCH" | "NEW EPISODES" | "ORIGINAL" | "LAB INCLUDED";
  tags: string[];
  instructor: {
    name: string;
    role: string;
    avatarInitials: string;
  };
  synopsis: string;
  keyOutcomes: string[];
  gradientTheme: string;
  interactiveLabType?: "trading-lab" | "risk-lab" | "binary-lab" | "revision";
  firstLessonId: string;
};

export type LearningPathMeta = {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryBadge: string;
  iconName: string;
  estimatedHours: number;
  lessonCount: number;
  difficulty: "Beginner" | "Developing" | "Advanced";
  prerequisitesDescription: string;
};

export type Skill = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  prerequisites: string[];
};

export const MASTERCLASSES_CATALOG: Masterclass[] = [
  {
    id: "class-forex-mastery",
    title: "Forex Foundations: Absolute Zero to Currency Mastery",
    tagline: "The definitive masterclass on currency exchange, quote conventions, pips, and market mechanics.",
    category: "Forex Foundations",
    pathId: "forex-foundations",
    seasonTag: "Season 1 · Complete Series",
    matchScore: 99,
    rating: 4.95,
    qualityBadge: "4K · INTERACTIVE LAB",
    level: "Beginner",
    durationTotal: "45 Mins · 5 Episodes",
    episodeCount: 5,
    top10Rank: 1,
    badge: "TOP 10",
    tags: ["#1 in Forex", "Zero Prior Knowledge", "Interactive Quizzes", "Quotes & Pips"],
    instructor: {
      name: "Dr. Marcus Vance",
      role: "Lead Currency Educator & Market Strategist",
      avatarInitials: "MV",
    },
    synopsis: "Step into the world's largest financial market with absolute clarity. Learn how global trade flows drive exchange rates, master Base vs Quote conventions in EUR/USD, calculate pips and spreads with pinpoint precision, and execute standard order types safely in virtual simulations.",
    keyOutcomes: [
      "Distinguish Base vs Quote currencies without hesitation",
      "Calculate pip moves and transaction costs across standard pairs",
      "Understand leverage limits and margin requirements",
      "Set defensive Stop Loss and Take Profit orders"
    ],
    gradientTheme: "from-emerald-950 via-teal-900 to-slate-950",
    interactiveLabType: "trading-lab",
    firstLessonId: "what-is-forex",
  },
  {
    id: "class-risk-defense",
    title: "Capital Defense & The Position Sizing Laboratory",
    tagline: "The most critical pillar in financial education: mathematical survival and risk budgets.",
    category: "Risk Management",
    pathId: "risk-management",
    seasonTag: "Season 1 · Lab Intensive",
    matchScore: 98,
    rating: 4.98,
    qualityBadge: "SIMULATOR INCLUDED",
    level: "Developing",
    durationTotal: "48 Mins · 4 Episodes",
    episodeCount: 4,
    top10Rank: 2,
    badge: "MUST WATCH",
    tags: ["Capital Defense", "Position Sizing", "1% Rule", "Drawdown Math"],
    instructor: {
      name: "Elena Rostova",
      role: "Chief Risk Architect & Quantitative Analyst",
      avatarInitials: "ER",
    },
    synopsis: "Professional risk managers do not ask 'How much can I make?'—they determine 'How much can I afford to lose?' Master the 1% risk rule, precision position sizing formulas, Reward-to-Risk ratios, and the non-linear mathematics of drawdown recovery.",
    keyOutcomes: [
      "Calculate exact lot sizes tailored to technical stop distances",
      "Survive unavoidable 5-trade losing streaks without panic",
      "Understand why 40% win rates can generate positive expectancy",
      "Prevent catastrophic account drawdowns before they happen"
    ],
    gradientTheme: "from-slate-950 via-emerald-900 to-cyan-950",
    interactiveLabType: "risk-lab",
    firstLessonId: "risk-per-trade",
  },
  {
    id: "class-market-structure",
    title: "Market Structure, Candlesticks & Price Action",
    tagline: "Learn to read candlestick anatomy across timeframes and identify market trends without hindsight bias.",
    category: "Technical Analysis",
    pathId: "technical-analysis",
    seasonTag: "Season 1 · Visual Series",
    matchScore: 96,
    rating: 4.91,
    qualityBadge: "REPLAY LAB ENABLED",
    level: "Beginner",
    durationTotal: "40 Mins · 4 Episodes",
    episodeCount: 4,
    top10Rank: 3,
    badge: "TRENDING",
    tags: ["Candlestick OHLC", "Market Structure", "Support & Resistance", "Lagging Indicators"],
    instructor: {
      name: "Kenji Takahashi",
      role: "Technical Analysis Instructor & Replay Specialist",
      avatarInitials: "KT",
    },
    synopsis: "Demystify Japanese candlesticks and market flow. Discover what OHLC bodies and wicks reveal about buyer-seller battles, spot Higher Highs and Lower Lows across swing structures, and learn why indicators lag behind incoming order flow.",
    keyOutcomes: [
      "Read OHLC anatomy and wick rejections across timeframes",
      "Identify Bullish Uptrends vs Bearish Downtrends accurately",
      "Draw horizontal Support & Resistance zones and role reversals",
      "Use technical indicators as filters rather than crystal balls"
    ],
    gradientTheme: "from-blue-950 via-indigo-950 to-slate-950",
    interactiveLabType: "trading-lab",
    firstLessonId: "candlestick-anatomy",
  },
  {
    id: "class-binary-exposed",
    title: "Exposing Binary Options: Mathematical Truths & The House Edge",
    tagline: "An educational investigation into fixed payout contracts, negative expected value, and regulatory warnings.",
    category: "Binary Options",
    pathId: "binary-options",
    seasonTag: "Special Exposé · 4 Episodes",
    matchScore: 97,
    rating: 4.96,
    qualityBadge: "PROBABILITY LAB",
    level: "Developing",
    durationTotal: "42 Mins · 4 Episodes",
    episodeCount: 4,
    top10Rank: 4,
    badge: "LAB INCLUDED",
    tags: ["Mathematical Truth", "Negative EV", "Broker House Edge", "Regulatory Warnings"],
    instructor: {
      name: "Dr. Arthur Pendelton",
      role: "Financial Regulation & Microstructure Researcher",
      avatarInitials: "AP",
    },
    synopsis: "Cut through deceptive marketing and examine the pure mathematics of binary options. Understand why an 80% payout contract enforces a structurally unsustainable 55.6% break-even win rate, test negative expected value decay in our tick simulator, and review tier-1 regulatory prohibitions (FCA, ESMA, ASIC).",
    keyOutcomes: [
      "Calculate mathematical break-even win rates on fixed payouts",
      "Understand why 60-second expiries are dominated by random noise",
      "Calculate negative expected value (-EV) per contract",
      "Identify red flags and protect yourself from trading scams"
    ],
    gradientTheme: "from-rose-950 via-red-950 to-slate-950",
    interactiveLabType: "binary-lab",
    firstLessonId: "binary-contract-mechanics",
  },
  {
    id: "class-trading-mind",
    title: "The Disciplined Mind: Conquering Tilt & Outcome Bias",
    tagline: "Separate decision quality from financial outcome and eliminate impulsive revenge trading.",
    category: "Trading Psychology",
    pathId: "trading-psychology",
    seasonTag: "Season 1 · Behavioral Masterclass",
    matchScore: 95,
    rating: 4.89,
    qualityBadge: "JOURNAL LAB",
    level: "Developing",
    durationTotal: "30 Mins · 2 Episodes",
    episodeCount: 2,
    top10Rank: 5,
    badge: "ORIGINAL",
    tags: ["Trading Psychology", "Outcome Bias", "Revenge Trading", "Daily Loss Caps"],
    instructor: {
      name: "Dr. Simone Dubois",
      role: "Behavioral Finance & Decision Psychologist",
      avatarInitials: "SD",
    },
    synopsis: "In probabilistic environments, a bad decision can make money by luck, and a good decision can lose money. Discover how to evaluate your trades by execution discipline (Process Score) rather than PnL, build daily loss circuit-breakers, and defeat emotional tilt.",
    keyOutcomes: [
      "Recognize outcome bias and evaluate process discipline",
      "Establish cooling-off routines after stop-outs",
      "Maintain rigorous pre-trade and post-trade decision journals",
      "Build probabilistic resilience across market uncertainty"
    ],
    gradientTheme: "from-purple-950 via-slate-900 to-slate-950",
    interactiveLabType: "trading-lab",
    firstLessonId: "process-over-outcomes",
  },
  {
    id: "class-drawdown-recovery",
    title: "The Drawdown Trap: The Asymmetric Math of Losses",
    tagline: "Why a 50% account loss demands a 100% gain just to break even, and how to stay in the safe zone.",
    category: "Risk Management",
    pathId: "risk-management",
    seasonTag: "Deep Dive · Masterclass",
    matchScore: 94,
    rating: 4.92,
    qualityBadge: "CURVE SIMULATOR",
    level: "Advanced",
    durationTotal: "20 Mins · 2 Episodes",
    episodeCount: 2,
    top10Rank: 6,
    tags: ["Drawdown Asymmetry", "Risk of Ruin", "Capital Protection"],
    instructor: {
      name: "Elena Rostova",
      role: "Chief Risk Architect",
      avatarInitials: "ER",
    },
    synopsis: "Examine the non-linear geometry of drawdown curves. Learn why small losses are easy to recover (+11% for a 10% loss), while large losses (+100% for a 50% loss) induce psychological collapse and mathematical ruin.",
    keyOutcomes: [
      "Model asymmetric drawdown recovery percentages",
      "Implement maximum daily and weekly loss stops",
      "Protect your virtual account equity curve"
    ],
    gradientTheme: "from-amber-950 via-slate-900 to-slate-950",
    interactiveLabType: "risk-lab",
    firstLessonId: "drawdown-recovery-math",
  },
];

export const LEARNING_PATHS: LearningPathMeta[] = [
  {
    id: "forex-foundations",
    title: "Forex Foundations",
    slug: "forex-foundations",
    description: "Understand global currency markets, exchange mechanics, quote conventions, pips, spreads and transaction costs.",
    categoryBadge: "Core Foundations",
    iconName: "Globe",
    estimatedHours: 1.5,
    lessonCount: 5,
    difficulty: "Beginner",
    prerequisitesDescription: "None — Designed for absolute zero knowledge.",
  },
  {
    id: "technical-analysis",
    title: "Market Structure & Technical Analysis",
    slug: "technical-analysis",
    description: "Learn to read candlesticks across timeframes, spot market trends, mark support and resistance, and use technical indicators with awareness of their limits.",
    categoryBadge: "Market Analysis",
    iconName: "TrendingUp",
    estimatedHours: 2.0,
    lessonCount: 4,
    difficulty: "Beginner",
    prerequisitesDescription: "Requires completion of Forex Foundations.",
  },
  {
    id: "risk-management",
    title: "Risk Management Laboratory & Position Sizing",
    slug: "risk-management",
    description: "The most critical pillar: calculate risk budgets, position sizing, stop-loss mechanics, leverage ratios, and drawdown mathematics.",
    categoryBadge: "Essential Defense",
    iconName: "ShieldAlert",
    estimatedHours: 2.5,
    lessonCount: 5,
    difficulty: "Developing",
    prerequisitesDescription: "Requires understanding of pips and currency pairs.",
  },
  {
    id: "trading-psychology",
    title: "Trading Psychology & Decision Discipline",
    slug: "trading-psychology",
    description: "Separate process quality from financial outcome, master probabilistic thinking, eliminate revenge trading, and maintain rigorous trade logs.",
    categoryBadge: "Mindset & Execution",
    iconName: "BrainCircuit",
    estimatedHours: 1.5,
    lessonCount: 3,
    difficulty: "Developing",
    prerequisitesDescription: "Requires completion of Risk Management basics.",
  },
  {
    id: "binary-options",
    title: "Binary Options Educational Pathway",
    slug: "binary-options",
    description: "Distinct educational study of binary contract mechanics, fixed payouts, break-even math, expected value decay, and regulatory consumer safeguards.",
    categoryBadge: "Educational Special",
    iconName: "SplitSquareVertical",
    estimatedHours: 1.5,
    lessonCount: 4,
    difficulty: "Developing",
    prerequisitesDescription: "Recommended for all learners to understand probability vs broker edge.",
  },
];

export const SKILLS_TAXONOMY: Skill[] = [
  { id: "SK-FX-01", code: "FX-BASE", name: "Currency Pair Structure", category: "Foundations", description: "Identifies base vs quote currencies and computes exchange values correctly.", prerequisites: [] },
  { id: "SK-FX-02", code: "FX-PIPS", name: "Pip & Spread Calculation", category: "Foundations", description: "Calculates price moves in pips, pip values and bid-ask spread transaction costs.", prerequisites: ["SK-FX-01"] },
  { id: "SK-TA-01", code: "TA-CANDLE", name: "Candlestick Interpretation", category: "Technical Analysis", description: "Reads OHLC anatomy and recognizes time-slice summaries without false forecasting.", prerequisites: ["SK-FX-02"] },
  { id: "SK-TA-02", code: "TA-SR", name: "Support & Resistance Levels", category: "Technical Analysis", description: "Identifies historical price rejection zones and breakout validation.", prerequisites: ["SK-TA-01"] },
  { id: "SK-RK-01", code: "RK-BUDGET", name: "Risk Per Trade Budgeting", category: "Risk Management", description: "Enforces max 1-2% hypothetical risk limits per single trade setup.", prerequisites: ["SK-FX-02"] },
  { id: "SK-RK-02", code: "RK-SIZE", name: "Position Sizing Precision", category: "Risk Management", description: "Computes exact lot sizing from stop distance, pip value and risk capital.", prerequisites: ["SK-RK-01"] },
  { id: "SK-RK-03", code: "RK-DRAW", name: "Drawdown & Asymmetric Recovery", category: "Risk Management", description: "Understands mathematical realities of account recovery and losing streaks.", prerequisites: ["SK-RK-02"] },
  { id: "SK-PS-01", code: "PS-PROB", name: "Probabilistic Thinking & Process Review", category: "Psychology", description: "Evaluates trading quality by execution adherence rather than random PnL outcome.", prerequisites: ["SK-RK-01"] },
  { id: "SK-BO-01", code: "BO-EV", name: "Binary Contract Expected Value", category: "Binary Options", description: "Calculates break-even win rate and negative expected value with fixed payouts.", prerequisites: ["SK-FX-01"] },
];

export const foundationLessons: Lesson[] = [
  // --- PATH 1: FOREX FOUNDATIONS ---
  {
    id: "what-is-forex",
    slug: "what-is-forex",
    title: "What is the Forex Market?",
    description: "Explore the world's largest financial market: foreign exchange mechanics, participants and price drivers.",
    pathId: "forex-foundations",
    category: "Forex foundations",
    level: "Beginner",
    duration: 6,
    order: 1,
    content: `Foreign exchange (Forex or FX) is the global decentralized marketplace where national currencies are traded against one another. It operates 24 hours a day, five days a week, across major financial centers including London, New York, Tokyo, Sydney, and Frankfurt.\n\nEvery cross-border purchase, international vacation, central bank monetary adjustment, or corporate hedge requires exchanging one currency for another. For instance, when a European airline buys aircraft manufactured in the United States, it converts Euros into US Dollars.\n\nBecause the volume of global transactions changes continuously based on international trade, central bank interest rate decisions, employment metrics, and geopolitical developments, exchange rates fluctuate in real-time.\n\nCrucial Academy Principle: Trading simulated exchange rates involves severe uncertainty. No indicator, newsletter, or algorithm guarantees future price direction. Our mission in this Academy is to develop disciplined, risk-conscious financial literacy using virtual simulations rather than risking hard-earned capital.`,
    takeaway: "Forex is foreign exchange: exchanging one currency for another. Exchange rates reflect relative supply and demand between two national economies.",
    question: "Which of the following best describes how currency exchange rates fluctuate?",
    options: [
      "Rates change based on relative supply, demand, trade flows, and central bank interest rate policies",
      "Rates are fixed permanently by international governments",
      "Rates are guaranteed to move upward over long periods",
      "Rates fluctuate purely due to retail social media sentiment"
    ],
    answer: 0,
    explanation: "Exchange rates are determined by relative macroeconomic factors, trade flows, interest rate differentials, and supply and demand between currencies.",
    questionsList: [
      {
        id: "q1",
        question: "Which of the following best describes how currency exchange rates fluctuate?",
        options: [
          "Rates change based on relative supply, demand, trade flows, and central bank interest rate policies",
          "Rates are fixed permanently by international governments",
          "Rates are guaranteed to move upward over long periods",
          "Rates fluctuate purely due to retail social media sentiment"
        ],
        answer: 0,
        explanation: "Exchange rates are determined by relative macroeconomic factors, trade flows, interest rate differentials, and supply and demand between currencies."
      },
      {
        id: "q2",
        question: "When is the Forex market open for continuous global trading?",
        options: [
          "Only 9:30 AM to 4:00 PM EST",
          "24 hours a day, 5 days a week across rolling global timezones",
          "Weekends only",
          "12 hours every Tuesday and Thursday"
        ],
        answer: 1,
        explanation: "The global FX market trades continuously 24/5 from Sunday evening (Sydney/Tokyo open) to Friday evening (New York close)."
      }
    ],
    prerequisiteId: null,
    skillIds: ["SK-FX-01"],
    status: "published",
    version: 1,
  },
  {
    id: "currency-pairs",
    slug: "currency-pairs",
    title: "Understanding Currency Pairs: Base vs Quote",
    description: "Learn how to read currency pairs like EUR/USD, GBP/USD and USD/JPY accurately.",
    pathId: "forex-foundations",
    category: "Forex foundations",
    level: "Beginner",
    duration: 8,
    order: 2,
    content: `Unlike buying shares of a single company, in Forex you can never buy or sell a single currency in isolation. You always exchange one currency relative to another.\n\nIn any currency pair notation (e.g., EUR/USD = 1.0850):\n- The first currency listed (EUR) is the Base Currency.\n- The second currency listed (USD) is the Quote Currency (or Counter Currency).\n\nThe quoted price represents exactly how much of the Quote Currency is needed to purchase ONE unit of the Base Currency.\n\nExample 1: EUR/USD = 1.0850 means 1 Euro costs 1.0850 US Dollars.\nIf the quote rises from 1.0850 to 1.0920, the Euro has strengthened relative to the US Dollar (or the Dollar has weakened relative to the Euro).\n\nExample 2: USD/JPY = 150.25 means 1 US Dollar costs 150.25 Japanese Yen.\nIf the quote falls to 148.50, the US Dollar has weakened relative to the Yen.`,
    takeaway: "Base is first, Quote is second. The quote price tells you how many units of quote currency equal 1 base unit.",
    question: "If GBP/USD is quoted at 1.2500, what does this figure mean?",
    options: [
      "1 US Dollar costs 1.25 British Pounds",
      "1 British Pound costs 1.25 US Dollars",
      "Both currencies have identical exchange value",
      "The British economy is 25% larger than the US economy"
    ],
    answer: 1,
    explanation: "GBP is the base currency and USD is the quote currency. Therefore 1 GBP = 1.25 USD.",
    prerequisiteId: "what-is-forex",
    skillIds: ["SK-FX-01"],
    status: "published",
    version: 1,
  },
  {
    id: "pips-spreads",
    slug: "pips-spreads",
    title: "Pips, Spreads & Transaction Costs",
    description: "Calculate pips, understand pip values, and calculate bid-ask spread costs on simulated trades.",
    pathId: "forex-foundations",
    category: "Forex foundations",
    level: "Beginner",
    duration: 10,
    order: 3,
    content: `A 'Pip' stands for 'Percentage in Point' or 'Price Interest Point'. It is the standardized unit of measurement for price changes in currency pairs.\n\n1. Standard 4-Decimal Pairs (EUR/USD, GBP/USD, AUD/USD):\n1 Pip = 0.0001 (the 4th decimal place).\nIf EUR/USD moves from 1.1020 to 1.1035, the price moved up by 15 pips.\n\n2. JPY 2-Decimal Pairs (USD/JPY, EUR/JPY, GBP/JPY):\n1 Pip = 0.01 (the 2nd decimal place).\nIf USD/JPY moves from 150.20 to 150.50, the price moved up by 30 pips.\n\nUnderstanding The Spread:\nEvery market has two prices simultaneously:\n- Bid Price: The price you can sell at.\n- Ask Price (Offer): The price you can buy at (always slightly higher).\n\nThe difference between Ask and Bid is the Spread. If Bid is 1.1000 and Ask is 1.1002, the spread is 2.0 pips. When you open a simulated trade, your position immediately starts at a slight unrealized loss equal to the spread. This friction is a real transaction cost!`,
    takeaway: "For EUR/USD, 1 pip is 0.0001. The spread is Ask minus Bid, representing the immediate cost of opening a trade.",
    question: "EUR/USD Bid is 1.0950 and Ask is 1.0952. What is the spread, and at what price would a BUY order open?",
    options: [
      "Spread is 2 pips; BUY order opens at Ask (1.0952)",
      "Spread is 20 pips; BUY order opens at Bid (1.0950)",
      "Spread is 0.2 pips; BUY order opens at 1.0950",
      "Spread is free; BUY order opens at mid-price 1.0951"
    ],
    answer: 0,
    explanation: "Ask (1.0952) - Bid (1.0950) = 0.0002 = 2 pips. Buying is executed at the Ask price.",
    prerequisiteId: "currency-pairs",
    skillIds: ["SK-FX-02"],
    status: "published",
    version: 1,
  },
  {
    id: "lot-sizes-leverage",
    slug: "lot-sizes-leverage",
    title: "Lot Sizes, Margin & Leverage Realities",
    description: "Demystify Standard, Mini and Micro lots, and understand the double-edged sword of leverage.",
    pathId: "forex-foundations",
    category: "Forex foundations",
    level: "Beginner",
    duration: 10,
    order: 4,
    content: `In Forex, trades are measured in standardized contract sizes called 'Lots':\n- Standard Lot (1.00 lot) = 100,000 units of base currency (Approx $10/pip on EUR/USD)\n- Mini Lot (0.10 lot) = 10,000 units of base currency (Approx $1/pip on EUR/USD)\n- Micro Lot (0.01 lot) = 1,000 units of base currency (Approx $0.10/pip on EUR/USD)\n\nWhat is Leverage?\nLeverage allows a trader to control a larger nominal position with a smaller initial cash deposit called 'Margin'.\nFor example, with 1:30 leverage, you deposit $1,000 margin to control a $30,000 position.\n\n⚠️ The Leverage Warning:\nLeverage amplifies BOTH potential virtual gains and potential virtual losses by the exact same multiple. If you use high leverage with an oversized lot, a small market move against your position can rapidly wipe out your entire account balance. Responsible risk managers choose position size first, not max leverage!`,
    takeaway: "1 standard lot = 100,000 units (~$10/pip). Leverage amplifies losses equally to gains.",
    question: "If you trade 0.10 lots (Mini lot) on EUR/USD, approximately how much is each pip worth in USD?",
    options: [
      "Approximately $0.10 per pip",
      "Approximately $1.00 per pip",
      "Approximately $10.00 per pip",
      "Approximately $100.00 per pip"
    ],
    answer: 1,
    explanation: "A mini lot (0.10 lots = 10,000 base units) has a pip value of approximately $1.00 per pip on EUR/USD.",
    prerequisiteId: "pips-spreads",
    skillIds: ["SK-FX-02"],
    status: "published",
    version: 1,
  },
  {
    id: "order-types",
    slug: "order-types",
    title: "Order Types: Market, Limit, Stop & SL/TP",
    description: "Learn how to use Market Orders, Pending Orders (Limit & Stop), and automatic Stop-Loss / Take-Profit brackets.",
    pathId: "forex-foundations",
    category: "Forex foundations",
    level: "Beginner",
    duration: 9,
    order: 5,
    content: `Knowing how to instruct the trading engine is fundamental to avoiding costly execution mistakes.\n\n1. Market Order:\nAn immediate execution order filled at the current best available market price.\n\n2. Limit Orders (Seeking a Better Price):\n- Buy Limit: Placed BELOW current market price, waiting for price to drop to a discount before buying.\n- Sell Limit: Placed ABOVE current market price, waiting for price to rise before selling.\n\n3. Stop Orders (Seeking Momentum / Breakout):\n- Buy Stop: Placed ABOVE current price, executing only when price breaks upward.\n- Sell Stop: Placed BELOW current price, executing only when price breaks downward.\n\n4. Protective Bracket Orders:\n- Stop Loss (SL): An automatic closing order to cap your maximum planned loss.\n- Take Profit (TP): An automatic closing order to secure your planned profit target.`,
    takeaway: "Market orders execute immediately; Limit orders seek discounts; Stop Loss orders are vital defensive safeguards.",
    question: "If current EUR/USD price is 1.1000 and you want to BUY only if price pulls down to 1.0960, which order type should you use?",
    options: [
      "Buy Market Order",
      "Buy Limit Order",
      "Buy Stop Order",
      "Sell Stop Order"
    ],
    answer: 1,
    explanation: "A Buy Limit is placed below current market price to enter at a lower, discounted price when the market retraces.",
    prerequisiteId: "lot-sizes-leverage",
    skillIds: ["SK-FX-01"],
    status: "published",
    version: 1,
  },

  // --- PATH 2: TECHNICAL ANALYSIS & MARKET STRUCTURE ---
  {
    id: "candlestick-anatomy",
    slug: "candlestick-anatomy",
    title: "Candlestick Anatomy & Timeframes",
    description: "Read Open, High, Low, and Close prices across 1M, 5M, 1H, and Daily timeframes without hindsight bias.",
    pathId: "technical-analysis",
    category: "Reading the market",
    level: "Beginner",
    duration: 9,
    order: 6,
    content: `Japanese Candlesticks condense price battle action over any chosen timeframe into an intuitive visual format.\n\nEach candlestick records 4 critical data points (OHLC):\n- Open: The price when the time interval began.\n- High: The highest price reached during the interval (top of the upper wick/shadow).\n- Low: The lowest price reached during the interval (bottom of the lower wick/shadow).\n- Close: The price when the time interval finished.\n\nBullish Candle (Green): Close is above Open.\nBearish Candle (Red): Close is below Open.\n\nTimeframe Perspective:\nA 1-Hour candle aggregates twelve 5-Minute candles. A long wick on a 1-Hour chart represents a rapid price rejection that occurred inside those smaller 5-Minute candles. No single candle guarantees the direction of the next candle!`,
    takeaway: "A candlestick represents OHLC data over a specific time window. Wicks reveal price extremes and rejections.",
    question: "What does a long lower shadow (wick) on a candlestick indicate?",
    options: [
      "Prices dropped significantly during the session, but buyers pushed the price back up before the close",
      "The market was completely closed during that period",
      "Sellers dominated from the open to the close with no buying activity",
      "Transaction fees were unusually high"
    ],
    answer: 0,
    explanation: "A long lower wick shows that prices made a low during the session, but strong buying demand rejected that low and pushed price upward before closing.",
    prerequisiteId: "order-types",
    skillIds: ["SK-TA-01"],
    status: "published",
    version: 1,
  },
  {
    id: "trends-and-structure",
    slug: "trends-and-structure",
    title: "Market Trends: Higher Highs & Market Structure",
    description: "Identify Uptrends, Downtrends, and Consolidation ranges using swing points.",
    pathId: "technical-analysis",
    category: "Reading the market",
    level: "Beginner",
    duration: 10,
    order: 7,
    content: `Markets do not move in straight lines; they move in waves (impulses and pullbacks). Market structure describes the relationship between consecutive swing highs and swing lows.\n\n1. Uptrend (Bullish Market Structure):\nCharacterized by a sequence of Higher Highs (HH) and Higher Lows (HL). Buyers remain willing to purchase at progressively higher levels.\n\n2. Downtrend (Bearish Market Structure):\nCharacterized by a sequence of Lower Highs (LH) and Lower Lows (LL). Sellers remain aggressive, pushing prices to new lows on every impulse.\n\n3. Consolidation / Range (Sideways Market):\nPrice oscillates horizontally between defined upper ceiling and lower floor boundaries without establishing directional momentum.\n\nIdentifying structure helps traders align their trades with the prevailing market tide rather than fighting against it.`,
    takeaway: "Uptrends make Higher Highs & Higher Lows. Downtrends make Lower Highs & Lower Lows.",
    question: "If a currency pair creates a series of Lower Highs followed by Lower Lows, what is the market structure?",
    options: [
      "Strong Bullish Uptrend",
      "Bearish Downtrend",
      "Tight Horizontal Consolidation",
      "Break-even equilibrium"
    ],
    answer: 1,
    explanation: "Lower Highs and Lower Lows define a Bearish Downtrend where sellers are in control of market structure.",
    prerequisiteId: "candlestick-anatomy",
    skillIds: ["SK-TA-01"],
    status: "published",
    version: 1,
  },
  {
    id: "support-and-resistance",
    slug: "support-and-resistance",
    title: "Support, Resistance & Key Price Zones",
    description: "Mark dynamic and horizontal price reaction levels and understand role-reversals.",
    pathId: "technical-analysis",
    category: "Reading the market",
    level: "Developing",
    duration: 11,
    order: 8,
    content: `Support and Resistance are horizontal price zones where buying or selling pressure historically concentrated.\n\n- Support (Floor): A price zone where buying interest is strong enough to overcome selling pressure and prevent price from dropping further.\n- Resistance (Ceiling): A price zone where selling interest is strong enough to overcome buying pressure and prevent price from climbing higher.\n\nThe Role Reversal Principle:\nWhen a strong resistance level is broken decisively to the upside, that level frequently becomes a new Support level on subsequent pullbacks. Likewise, broken support frequently flips into new resistance.\n\nAlways treat Support and Resistance as 'Zones' rather than razor-thin single prices, because market participants place orders over a band of liquidity.`,
    takeaway: "Support is a buying zone (floor); Resistance is a selling zone (ceiling). When broken, their roles frequently reverse.",
    question: "What often happens when an established resistance level is broken decisively to the upside?",
    options: [
      "It becomes permanently irrelevant",
      "It frequently flips into a new support level during subsequent pullbacks",
      "The market immediately terminates trading",
      "The currency pair will never drop again"
    ],
    answer: 1,
    explanation: "This is the classic Role Reversal principle: broken resistance often acts as new support on future retests.",
    prerequisiteId: "trends-and-structure",
    skillIds: ["SK-TA-02"],
    status: "published",
    version: 1,
  },
  {
    id: "indicators-limitations",
    slug: "indicators-limitations",
    title: "Technical Indicators & Their Real Limitations",
    description: "Examine Moving Averages, RSI, and MACD. Understand why all indicators lag price action.",
    pathId: "technical-analysis",
    category: "Reading the market",
    level: "Developing",
    duration: 10,
    order: 9,
    content: `Technical indicators are mathematical derivative formulas calculated strictly from past price and volume data. Common examples include Simple Moving Averages (SMA), Exponential Moving Averages (EMA), and the Relative Strength Index (RSI).\n\nKey Realities Every Learner Must Know:\n1. All Indicators Lag: Because formulas calculate past prices, an indicator can never know what news or large order flow will occur in the next millisecond.\n2. Overbought Does Not Mean 'Sell Immediately': An RSI reading above 70 in a strong uptrend can remain 'overbought' for hundreds of pips while price continues rocketing higher.\n3. The Dangers of Indicator Overload: Stacking 6 indicators on a chart creates 'analysis paralysis' and conflicting signals.\n\nIndicators are best used as secondary filters to confirm market structure and risk parameters, not as magic crystal balls.`,
    takeaway: "All indicators are mathematical derivations of past price. They lag price and cannot predict future news.",
    question: "Why can't technical indicators provide guaranteed future market predictions?",
    options: [
      "Because they are calculated solely from historical price data and cannot forecast unexpected economic events",
      "Because brokers manipulate all indicator formulas",
      "Because indicators only work during weekend sessions",
      "Because indicators only track equity markets, not currencies"
    ],
    answer: 0,
    explanation: "Indicators are mathematical transformations of past OHLC data; they inherently lag and cannot forecast future events or incoming order flow.",
    prerequisiteId: "support-and-resistance",
    skillIds: ["SK-TA-02"],
    status: "published",
    version: 1,
  },

  // --- PATH 3: RISK MANAGEMENT MASTERY ---
  {
    id: "risk-per-trade",
    slug: "risk-per-trade",
    title: "The 1% Rule: Defining Your Risk Budget",
    description: "Protect trading capital by capping individual trade exposure to a strict percentage of your account.",
    pathId: "risk-management",
    category: "Risk management",
    level: "Beginner",
    duration: 10,
    order: 10,
    content: `Capital preservation is the absolute prerequisite for long-term trading longevity. Professional risk managers focus first on 'How much could this decision lose?' rather than 'How much could I make?'\n\nThe Golden Rule of Risk Budgeting:\nNever risk more than 1% to 2% of your total account balance on any single trade setup.\n\nLet's calculate your Risk Budget:\n- Virtual Account Balance: $10,000\n- Maximum Risk Budget (1%): $10,000 × 0.01 = $100\n- Maximum Risk Budget (2%): $10,000 × 0.02 = $200\n\nWhy does this matter?\nIf you risk 10% per trade and suffer 5 consecutive losing trades, your account loses over 40% of its capital. If you risk 1% per trade and suffer 5 consecutive losing trades, your account is still at ~95% capital. You survive to trade another day!`,
    takeaway: "Cap risk to 1-2% of account equity per trade. Capital preservation enables you to endure inevitable losing streaks.",
    question: "If your virtual account equity is $25,000 and your risk rule is 1.5% per trade, what is your maximum allowed dollar risk budget?",
    options: [
      "$250.00",
      "$375.00",
      "$500.00",
      "$1,500.00"
    ],
    answer: 1,
    explanation: "$25,000 × 0.015 = $375.00. That is your exact risk budget for placing a stop loss.",
    prerequisiteId: "order-types",
    skillIds: ["SK-RK-01"],
    status: "published",
    version: 1,
  },
  {
    id: "position-sizing-formula",
    slug: "position-sizing-formula",
    title: "The Precision Position Sizing Formula",
    description: "Master the exact mathematical formula that connects risk budget, stop distance, and lot sizing.",
    pathId: "risk-management",
    category: "Risk management",
    level: "Developing",
    duration: 12,
    order: 11,
    content: `Many beginners make the fatal error of trading a fixed lot size (e.g., always 1.0 lot) regardless of how wide their stop loss is. This means their actual risk fluctuates wildly on every trade!\n\nThe Professional Formula:\nPosition Size (Lots) = Risk Budget ($) ÷ [Stop Distance (Pips) × Pip Value ($ per standard lot)]\n\nStep-by-Step Example:\n- Account Balance: $10,000\n- Risk Budget (1%): $100\n- Technical Stop Loss Distance: 25 Pips\n- Currency Pair: EUR/USD (Pip value = $10 per standard lot)\n\nCalculation:\nLots = $100 ÷ (25 pips × $10/pip) = $100 ÷ $250 = 0.40 Lots (Mini Lots: 4)\n\nIf the stop distance was wider (e.g. 50 pips):\nLots = $100 ÷ (50 pips × $10/pip) = $100 ÷ $500 = 0.20 Lots.\nNotice how the lot size automatically shrank to keep your risk at exactly $100!`,
    takeaway: "Position size must dynamically adapt to your technical stop distance: Lots = Risk Budget ÷ (Stop Pips × Pip Value).",
    question: "Risk Budget is $150, technical stop is 30 pips on EUR/USD ($10/pip/standard lot). What is the correct lot size?",
    options: [
      "0.15 lots",
      "0.50 lots",
      "1.50 lots",
      "3.00 lots"
    ],
    answer: 1,
    explanation: "Lots = $150 ÷ (30 × $10) = $150 ÷ $300 = 0.50 standard lots.",
    prerequisiteId: "risk-per-trade",
    skillIds: ["SK-RK-02"],
    status: "published",
    version: 1,
  },
  {
    id: "reward-to-risk-ratio",
    slug: "reward-to-risk-ratio",
    title: "Reward-to-Risk (R:R) Ratios & Win Rate Realities",
    description: "Understand why a 40% win rate can be sustainable with a 1:2 R:R, while an 80% win rate can lose money with poor R:R.",
    pathId: "risk-management",
    category: "Risk management",
    level: "Developing",
    duration: 11,
    order: 12,
    content: `The profitability of a trading strategy is governed by the interplay between Win Rate and Reward-to-Risk (R:R) ratio.\n\nWhat is Reward-to-Risk (R:R)?\nIt compares the potential profit target against the planned stop-loss risk.\n- A 1:1 R:R means risking $100 to make $100.\n- A 1:2 R:R means risking $100 to make $200.\n- A 1:3 R:R means risking $100 to make $300.\n\nThe Math of Strategy Viability:\nImagine 10 consecutive simulated trades with 1:2 R:R (Risk $100 to gain $200):\n- Win 4 trades: 4 × +$200 = +$800\n- Lose 6 trades: 6 × -$100 = -$600\n- Net Virtual Result: +$200 Profit (Even with a 40% win rate!)\n\nConversely, a trader with a 90% win rate who risks $1,000 to make $50 will lose everything if one unexpected rogue trade wipes out 20 previous wins. Never neglect your R:R!`,
    takeaway: "A 40% win rate with 1:2 R:R is positive expectancy. Win rate alone without R:R is meaningless.",
    question: "You make 10 trades with 1:2 R:R ($100 risk for $200 target). You win 5 trades and lose 5 trades. What is your net result?",
    options: [
      "Break-even ($0)",
      "+$500 net gain (Wins: +$1,000, Losses: -$500)",
      "-$250 net loss",
      "+$1,000 net gain"
    ],
    answer: 1,
    explanation: "5 wins × $200 = +$1,000. 5 losses × $100 = -$500. Net result = +$500 virtual profit.",
    prerequisiteId: "position-sizing-formula",
    skillIds: ["SK-RK-02"],
    status: "published",
    version: 1,
  },
  {
    id: "drawdown-recovery-math",
    slug: "drawdown-recovery-math",
    title: "Drawdown Asymmetry: The Mathematics of Recovery",
    description: "Learn the non-linear math of account drawdowns and why avoiding deep losses is mathematically mandatory.",
    pathId: "risk-management",
    category: "Risk management",
    level: "Advanced",
    duration: 10,
    order: 13,
    content: `Drawdown is the percentage reduction in an account's equity from its highest historical peak to its lowest subsequent trough.\n\n⚠️ The Asymmetry Trap of Losses:\nWhen you lose account capital, you need a disproportionately larger percentage gain on your remaining funds just to get back to even!\n\nDrawdown Recovery Table:\n- 10% Loss → Requires +11.1% gain to break even\n- 20% Loss → Requires +25.0% gain to break even\n- 30% Loss → Requires +42.8% gain to break even\n- 50% Loss → Requires +100.0% gain to break even (Double your money!)\n- 80% Loss → Requires +400.0% gain to break even\n- 90% Loss → Requires +900.0% gain to break even\n\nConclusion:\nOnce an account enters deep drawdown (30%+), psychological panic spikes and the mathematical odds of recovery collapse. This is why disciplined risk limits are non-negotiable from trade number one.`,
    takeaway: "Losing 50% of your account requires a 100% gain just to break even. Defending against drawdowns is priority #1.",
    question: "If a simulated account drops by 50% from $10,000 to $5,000, what percentage gain is required on the remaining $5,000 to return to $10,000?",
    options: [
      "50% gain",
      "75% gain",
      "100% gain",
      "200% gain"
    ],
    answer: 2,
    explanation: "To grow $5,000 back into $10,000, you need $5,000 in new gains: $5,000 / $5,000 = 100% gain.",
    prerequisiteId: "reward-to-risk-ratio",
    skillIds: ["SK-RK-03"],
    status: "published",
    version: 1,
  },

  // --- PATH 4: TRADING PSYCHOLOGY & DECISION DISCIPLINE ---
  {
    id: "process-over-outcomes",
    slug: "process-over-outcomes",
    title: "Process Over Outcomes: Avoiding Outcome Bias",
    description: "Understand why a profitable trade can still be a terrible decision, and why a losing trade can be excellent execution.",
    pathId: "trading-psychology",
    category: "Trading psychology",
    level: "Developing",
    duration: 10,
    order: 14,
    content: `In probabilistic environments like financial markets, outcome bias is the dangerous habit of judging the quality of a past decision solely by whether it made or lost virtual money.\n\nConsider Scenario A:\nA learner ignores stop loss rules, gambles 50% of their account on a hunch, and the price happens to spike favorably, making +$2,000.\nEvaluation: Terrible process! The learner was lucky this time, but repeating this undisciplined behavior guarantees account wipeout.\n\nConsider Scenario B:\nA learner identified valid market structure, calculated exact 1% risk position size, placed a stop loss behind support, and the trade was stopped out for a -$100 loss when unexpected breaking news hit.\nEvaluation: Excellent process! The learner executed flawlessly according to their rules.\n\nIn our Academy analytics, we evaluate and reward your Process Score, not just random PnL!`,
    takeaway: "Judge execution by plan adherence and risk discipline, not short-term luck. Good process compounds; bad habits destroy.",
    question: "A learner breaks their risk rules, refuses to place a stop loss, and wins $500 by luck. How should this trade be reviewed?",
    options: [
      "As a masterclass strategy that should be repeated with even bigger size",
      "As a flawed process error that carried unacceptable risk of ruin",
      "As proof that risk management rules are unnecessary",
      "As a verified edge in the market"
    ],
    answer: 1,
    explanation: "Winning through reckless rules is luck that breeds fatal overconfidence. A good review flags the rule violation immediately.",
    prerequisiteId: "drawdown-recovery-math",
    skillIds: ["SK-PS-01"],
    status: "published",
    version: 1,
  },
  {
    id: "revenge-trading-biases",
    slug: "revenge-trading-biases",
    title: "Eliminating Revenge Trading & Emotional Tilt",
    description: "Identify emotional triggers, revenge trading spirals, and establish cooling-off protocols.",
    pathId: "trading-psychology",
    category: "Trading psychology",
    level: "Developing",
    duration: 9,
    order: 15,
    content: `Revenge trading is the emotional urge to immediately re-enter the market after a loss with increased position size to 'win back' lost funds quickly.\n\nThe Psychology Cycle of Tilt:\n1. A trade hits stop loss → Feeling of frustration or wounded ego.\n2. Cognitive distortion → 'The market owes me that money back!'\n3. Impulsive re-entry → Entering without a valid technical setup, doubling lot size.\n4. Second larger loss → Emotional panic and severe account damage.\n\nHow Disciplined Traders Prevent Tilt:\n- Set a Daily Loss Limit (e.g. Max 3% loss in a single day → trading platform locked until next session).\n- Mandatory 15-minute cooling off period after any stop out.\n- Trade review journaling: writing down emotions before submitting orders.`,
    takeaway: "Revenge trading after a loss is the #1 cause of catastrophic blowouts. Use daily loss limits and mandatory cool-offs.",
    question: "What is the most effective safeguard against revenge trading after suffering two consecutive losses?",
    options: [
      "Immediately quadruple lot size to recover both losses in one trade",
      "Switch to an exotic currency pair and take an impulse trade",
      "Enforce a mandatory daily loss pause and step away from the trading terminal",
      "Blame the broker and remove all stop loss safeguards"
    ],
    answer: 2,
    explanation: "Enforcing daily loss caps and stepping away breaks the emotional tilt cycle and prevents catastrophic revenge trading.",
    prerequisiteId: "process-over-outcomes",
    skillIds: ["SK-PS-01"],
    status: "published",
    version: 1,
  },

  // --- PATH 5: BINARY OPTIONS EDUCATIONAL PATHWAY ---
  {
    id: "binary-contract-mechanics",
    slug: "binary-contract-mechanics",
    title: "Binary Options Mechanics: Fixed Stakes & Expiries",
    description: "Understand the 'All-or-Nothing' contract structure, fixed expiry horizons (60s to 1hr), and strike price comparisons.",
    pathId: "binary-options",
    category: "Binary options education",
    level: "Developing",
    duration: 10,
    order: 16,
    content: `Binary Options are exotic derivative contracts with an 'all-or-nothing' proposition based on whether an underlying asset's price will be above or below a specific Strike Price at an exact Expiry Time.\n\nHow Binary Contracts Operate:\n- You choose an asset (e.g. EUR/USD).\n- You select a Direction:\n  • 'CALL' (Higher): You predict price will be above strike at expiry.\n  • 'PUT' (Lower): You predict price will be below strike at expiry.\n- You select an Expiry Window: e.g. 60 Seconds, 5 Minutes, 1 Hour.\n- You commit a fixed Stake (e.g. $100 virtual cash).\n\nThe Asymmetric Payoff:\n- If you are correct: You receive your $100 stake back PLUS a fixed payout percentage (e.g. 75% to 85% = +$80 profit).\n- If you are incorrect by even 0.1 pip: You lose 100% of your stake (-$100 loss).\n\nNotice that unlike Forex (where you can manage stop distance and capture multi-pip trend runners), binary options contracts feature capped upside and 100% downside on every contract.`,
    takeaway: "Binary options offer fixed capped payouts (e.g. 80%) for winning predictions, but forfeit 100% of the stake for losing predictions.",
    question: "In a binary option contract with an 80% payout and a $100 stake, what are the possible financial outcomes?",
    options: [
      "Win +$80 profit (total $180 return) OR Lose entire -$100 stake",
      "Win +$100 profit OR Lose -$80",
      "Win unlimited profit OR Lose max $10",
      "There is no risk of losing the initial stake"
    ],
    answer: 0,
    explanation: "Win returns stake + 80% ($180 total, $80 net profit); loss forfeits the entire $100 stake (100% loss).",
    prerequisiteId: "pips-spreads",
    skillIds: ["SK-BO-01"],
    status: "published",
    version: 1,
  },
  {
    id: "binary-expected-value-math",
    slug: "binary-expected-value-math",
    title: "Expected Value & Break-Even Win Rate Math",
    description: "Calculate why an 80% payout requires an unsustainable 55.6% win rate just to break even.",
    pathId: "binary-options",
    category: "Binary options education",
    level: "Developing",
    duration: 12,
    order: 17,
    content: `Let's analyze the mathematical Expected Value (EV) of trading binary options with typical broker payout structures.\n\nCalculating Required Break-Even Win Rate:\nFormula: Break-Even Win Rate (%) = Stake ÷ (Stake + Payout)\n\nExample with an 80% Payout ($100 stake, $80 profit on win):\nBreak-Even Win Rate = $100 ÷ ($100 + $80) = $100 ÷ $180 = 55.56%\n\nExample with a 70% Payout ($100 stake, $70 profit on win):\nBreak-Even Win Rate = $100 ÷ ($100 + $70) = $100 ÷ $170 = 58.82%\n\nWhat happens with a 50/50 prediction accuracy (Coin flip)?\nExpected Value per $100 trade with 80% payout:\nEV = (0.50 × +$80) + (0.50 × -$100) = +$40 - $50 = -$10.00 Expected Loss per trade!\n\nThis built-in mathematical negative expected value acts as a heavy structural 'house edge' (comparable to casino roulette), which compounds against participants over high sample sizes.`,
    takeaway: "With an 80% payout, you must maintain a 55.6%+ win rate just to break even. Random guessing loses an expected -$10 per $100 trade.",
    question: "If a binary options broker offers a 75% payout on EUR/USD contracts, what win rate is mathematically required just to break even?",
    options: [
      "50.0%",
      "57.14% ($100 / $175)",
      "75.0%",
      "42.8%"
    ],
    answer: 1,
    explanation: "Break-even win rate = 100 / (100 + 75) = 100 / 175 = 57.14%. Anything below 57.14% results in long-term net loss.",
    prerequisiteId: "binary-contract-mechanics",
    skillIds: ["SK-BO-01"],
    status: "published",
    version: 1,
  },
  {
    id: "short-term-noise-gambling",
    slug: "short-term-noise-gambling",
    title: "Short-Term Variance (60s Expiries) vs Trading Edge",
    description: "Explore why ultra short-term 60-second expiries are dominated by random noise, spreads, and high-frequency friction.",
    pathId: "binary-options",
    category: "Binary options education",
    level: "Developing",
    duration: 10,
    order: 18,
    content: `Many online advertisements market 30-second and 60-second binary options as 'easy fast money'. In market microstructure, this is mathematically false.\n\n1. Market Noise on Micro-Timeframes:\nOver a 60-second window, price fluctuations are primarily dominated by random order flow arrival, liquidity provider quotes, bid-ask bouncing, and microsecond spreads rather than macroeconomic or chart structure trends.\n\n2. Inability to Manage Risk Dynamically:\nIn Forex, if the market starts turning against your position, you can trail your stop loss or exit early for a partial loss. In binary options, if price is 0.1 pip below strike at the 60th second, you forfeit 100% of your stake.\n\n3. High-Frequency Overtrading Spiral:\nFast expiries trigger dopamine reward cycles that mimic casino slot machines, causing traders to take dozens of impulse bets and rapidly depleting balances through the house edge.`,
    takeaway: "60-second price ticks are predominantly random noise. Ultra-short expiries trigger gambling impulses and compound negative EV.",
    question: "Why are 60-second binary option expiries particularly hazardous for retail learners?",
    options: [
      "Micro-timeframe price ticks are high-variance noise, and fast expiries stimulate compulsive gambling behaviors",
      "Because 60-second expiries are only available on gold commodities",
      "Because technical indicators work with 100% accuracy on 60-second charts",
      "Because brokers pay 200% on 60-second trades"
    ],
    answer: 0,
    explanation: "Short-term ticks are statistical noise, and rapid turnaround fosters addictive overtrading while compounding broker house edge.",
    prerequisiteId: "binary-expected-value-math",
    skillIds: ["SK-BO-01"],
    status: "published",
    version: 1,
  },
  {
    id: "binary-regulatory-disclosures",
    slug: "binary-regulatory-disclosures",
    title: "Regulatory Warnings & Avoiding Common Scams",
    description: "Learn about global regulatory bans (ESMA, FCA, CFTC), offshore broker scam patterns, and consumer protections.",
    pathId: "binary-options",
    category: "Binary options education",
    level: "Developing",
    duration: 10,
    order: 19,
    content: `Because of their high risk and structural negative expectancy for retail participants, binary options are heavily regulated or prohibited in multiple tier-1 jurisdictions:\n\n- United Kingdom (FCA): Banned retail binary options sales permanently.\n- European Union (ESMA): Banned marketing and distribution of binary options to retail clients.\n- United States (CFTC/SEC): Only permits regulated exchange-traded binaries (e.g. Nadex), while warning strongly against unregistered offshore websites.\n- Australia (ASIC): Imposed strict product intervention bans.\n\nRed Flags of Binary Option Scams:\n🚩 'Guaranteed daily income' or '100% automated trading bot' claims.\n🚩 Social media accounts showcasing luxury cars and fake withdrawal receipts.\n🚩 Account managers who trade 'on your behalf' and demand additional deposit fees when you try to withdraw.\n\nOur Academy is strictly educational and virtual. We never accept deposits, do not partner with real-money binary brokers, and encourage all learners to verify regulatory licensing.`,
    takeaway: "Binary options are banned or restricted by FCA, ESMA and ASIC for retail users. Never trust guaranteed profit claims or offshore brokers.",
    question: "What is a major red flag indicating a potential financial trading scam?",
    options: [
      "A platform providing transparent educational risk warnings and virtual simulation accounts",
      "Guarantees of 100% automated daily profits, 'secret algorithms', and refusal to allow withdrawals without extra fees",
      "Clear disclosures stating that trading carries risk of capital loss",
      "Encouraging students to practice on virtual accounts first"
    ],
    answer: 1,
    explanation: "Guaranteed profits and withdrawal fee demands are classic hallmarks of fraudulent offshore schemes.",
    prerequisiteId: "short-term-noise-gambling",
    skillIds: ["SK-BO-01"],
    status: "published",
    version: 1,
  },
];

export const DIAGNOSTIC_QUESTIONS = [
  {
    id: "diag-1",
    category: "Foundations",
    question: "In the currency pair EUR/USD quoted at 1.0850, which is the base currency?",
    options: ["USD", "EUR", "Both", "Neither"],
    answer: 1,
    explanation: "EUR is the first listed currency, making it the Base Currency.",
  },
  {
    id: "diag-2",
    category: "Foundations",
    question: "If EUR/USD moves from 1.1000 to 1.1025, how many pips did the exchange rate advance?",
    options: ["2.5 pips", "25 pips", "250 pips", "0.25 pips"],
    answer: 1,
    explanation: "For 4-decimal currency pairs, 0.0025 is exactly 25 pips.",
  },
  {
    id: "diag-3",
    category: "Foundations",
    question: "What is the Bid-Ask spread?",
    options: [
      "The profit guaranteed by the broker",
      "The difference between the buying price (Ask) and selling price (Bid)",
      "The maximum leverage allowed on an account",
      "The daily interest rate on holding currency"
    ],
    answer: 1,
    explanation: "Spread = Ask minus Bid price, representing the immediate market friction cost.",
  },
  {
    id: "diag-4",
    category: "Technical Analysis",
    question: "What does the top wick (upper shadow) of a candlestick represent?",
    options: [
      "The opening price",
      "The closing price",
      "The highest price traded during that candle's timeframe",
      "The average price over 20 periods"
    ],
    answer: 2,
    explanation: "The tip of the upper wick marks the session High.",
  },
  {
    id: "diag-5",
    category: "Technical Analysis",
    question: "What sequence defines a classic Bullish Uptrend in market structure?",
    options: [
      "Lower Highs and Lower Lows",
      "Higher Highs and Higher Lows",
      "Equal Highs with falling volume",
      "Horizontal stagnation"
    ],
    answer: 1,
    explanation: "A series of Higher Highs (HH) and Higher Lows (HL) constitutes an uptrend.",
  },
  {
    id: "diag-6",
    category: "Risk Management",
    question: "According to professional risk management, what is the maximum recommended risk percentage per single trade?",
    options: [
      "1% to 2% of total account balance",
      "10% to 20% of account balance",
      "50% of account balance",
      "Whatever amount you feel confident about"
    ],
    answer: 0,
    explanation: "Capping risk at 1-2% preserves capital across inevitable losing streaks.",
  },
  {
    id: "diag-7",
    category: "Risk Management",
    question: "Account balance is $10,000. Risk budget is 1% ($100). Technical stop is 20 pips on EUR/USD ($10/pip). What is the correct lot size?",
    options: [
      "0.10 lots",
      "0.50 lots ($100 / [20 × $10])",
      "2.00 lots",
      "5.00 lots"
    ],
    answer: 1,
    explanation: "Lots = $100 ÷ (20 × $10) = $100 ÷ $200 = 0.50 standard lots.",
  },
  {
    id: "diag-8",
    category: "Risk Management",
    question: "If an account loses 50% of its capital, what percentage return on remaining equity is needed just to break even?",
    options: ["50%", "75%", "100%", "200%"],
    answer: 2,
    explanation: "A 50% drop requires doubling the remaining funds (a +100% gain) to restore starting capital.",
  },
  {
    id: "diag-9",
    category: "Psychology",
    question: "Why is judging a trade purely by whether it made or lost virtual money a mistake ('Outcome Bias')?",
    options: [
      "Because a reckless trade can win by random luck, while a disciplined trade can lose to unexpected news",
      "Because money is not important in financial markets",
      "Because winning trades never count towards progress",
      "Because stop loss orders are always illegal"
    ],
    answer: 0,
    explanation: "Markets are probabilistic; a good decision can lose and a bad decision can win in the short run.",
  },
  {
    id: "diag-10",
    category: "Binary Options",
    question: "In a binary options contract with an 80% payout, why does a 50% win rate lose money over time?",
    options: [
      "Because the payout on wins (+$80) is lower than the loss on forfeiting stake (-$100), creating negative expected value",
      "Because brokers charge monthly maintenance fees",
      "Because binary options automatically expire at zero",
      "Because win rates above 50% are prohibited"
    ],
    answer: 0,
    explanation: "With an 80% payout, break-even requires 55.6% wins. A 50% win rate yields -$10 EV per $100 contract.",
  },
];

export const SPACED_REPETITION_CARDS = [
  {
    id: "rev-1",
    skillId: "SK-FX-01",
    lessonId: "currency-pairs",
    front: "In the pair GBP/USD = 1.2800, which is the Base currency and what does 1.2800 mean?",
    back: "Base is GBP; Quote is USD. 1 British Pound costs 1.2800 US Dollars.",
    category: "Foundations",
  },
  {
    id: "rev-2",
    skillId: "SK-FX-02",
    lessonId: "pips-spreads",
    front: "How many pips is a move from 1.0920 to 1.0965 on EUR/USD?",
    back: "45 pips (0.0045 / 0.0001 = 45 pips).",
    category: "Foundations",
  },
  {
    id: "rev-3",
    skillId: "SK-RK-02",
    lessonId: "position-sizing-formula",
    front: "What is the formula for calculating lot size from a risk budget?",
    back: "Lots = Risk Budget ($) ÷ [Stop Distance (Pips) × Pip Value ($ per standard lot)]",
    category: "Risk Management",
  },
  {
    id: "rev-4",
    skillId: "SK-TA-01",
    lessonId: "candlestick-anatomy",
    front: "What four data points does every candlestick contain?",
    back: "Open, High, Low, and Close (OHLC) for that specific timeframe interval.",
    category: "Technical Analysis",
  },
  {
    id: "rev-5",
    skillId: "SK-BO-01",
    lessonId: "binary-expected-value-math",
    front: "What is the break-even win rate formula for binary options with a fixed payout?",
    back: "Break-Even % = Stake ÷ (Stake + Payout). For 80% payout: 100 / 180 = 55.56%.",
    category: "Binary Options",
  },
  {
    id: "rev-6",
    skillId: "SK-RK-03",
    lessonId: "drawdown-recovery-math",
    front: "What gain is required to recover from a 20% drawdown vs a 50% drawdown?",
    back: "20% drawdown requires +25% gain. 50% drawdown requires +100% gain (asymmetric recovery).",
    category: "Risk Management",
  },
];

export function isUnlocked(lesson: Lesson, completedIds: string[]) {
  if (!lesson.prerequisiteId) return true;
  return completedIds.includes(lesson.prerequisiteId);
}
