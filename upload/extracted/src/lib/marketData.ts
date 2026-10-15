export type Candle = {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type SimulationChallenge = {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  targetR: number; // e.g. 2.0 (Target +2R)
  maxRiskPercent: number; // e.g. 1.0%
  description: string;
  winCondition: string;
  hint: string;
  recommendedInstrument: string;
  initialIndex: number;
};

export type Instrument = {
  symbol: string;
  name: string;
  category: "Forex Major" | "Forex Cross" | "Commodities" | "Crypto";
  pipSize: number;
  pipValueStandard: number; // in USD per standard lot
  defaultSpread: number; // in pips
  commissionPerLot: number; // in USD
  description: string;
  scenarioTitle: string;
  scenarioDescription: string;
  initialReplayIndex: number; // Starts replay without look-ahead bias
  candles: Candle[];
};

export type DrawingToolType = "none" | "horizontal_ray" | "trendline" | "fibonacci" | "rr_box";

export type DrawingItem = {
  id: string;
  type: DrawingToolType;
  price1: number;
  price2?: number;
  index1: number;
  index2?: number;
  color: string;
  label?: string;
};

// 1. EUR/USD: Support Retest & Trend Continuation
function generateEurUsd(): Candle[] {
  const baseTime = 1715000000;
  const candles: Candle[] = [];
  let currentPrice = 1.0820;

  const priceMovements = [
    0.0003, -0.0004, 0.0002, -0.0001, 0.0005, -0.0003, 0.0002, 0.0004, -0.0005, 0.0001,
    -0.0002, 0.0004, -0.0003, 0.0001, 0.0002, -0.0004, 0.0006, -0.0002, 0.0003, -0.0001,
    0.0004, -0.0002, 0.0005, -0.0003, 0.0002,
    // Breakout impulse
    0.0008, 0.0012, 0.0006, -0.0003, 0.0009, 0.0011, 0.0007, -0.0004, 0.0008, 0.0006,
    0.0004, -0.0002, 0.0005, 0.0003, -0.0002,
    // Pullback retest of 1.0865
    -0.0005, -0.0007, -0.0004, -0.0006, -0.0003, 0.0001, -0.0002, 0.0001, 0.0002, 0.0003,
    // Extension
    0.0006, 0.0008, 0.0010, -0.0003, 0.0007, 0.0009, 0.0012, -0.0004, 0.0008, 0.0011,
    0.0005, -0.0003, 0.0009, 0.0007, 0.0010, -0.0004, 0.0008, 0.0006, 0.0011, -0.0002,
    0.0007, 0.0009, 0.0005, -0.0003, 0.0008, 0.0006, 0.0007, -0.0002, 0.0005, 0.0004
  ];

  for (let i = 0; i < priceMovements.length; i++) {
    const move = priceMovements[i];
    const open = Math.round(currentPrice * 100000) / 100000;
    const close = Math.round((open + move) * 100000) / 100000;
    const maxVal = Math.max(open, close);
    const minVal = Math.min(open, close);
    const high = Math.round((maxVal + Math.random() * 0.0004 + 0.0001) * 100000) / 100000;
    const low = Math.round((minVal - Math.random() * 0.0004 - 0.0001) * 100000) / 100000;
    const volume = Math.round(1200 + Math.random() * 1800 + Math.abs(move) * 500000);

    const ts = baseTime + i * 3600;
    const d = new Date(ts * 1000);
    const timeStr = `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:00`;

    candles.push({ time: timeStr, timestamp: ts, open, high, low, close, volume });
    currentPrice = close;
  }
  return candles;
}

// 2. GBP/USD: Head & Shoulders Structural Reversal
function generateGbpUsd(): Candle[] {
  const baseTime = 1715200000;
  const candles: Candle[] = [];
  let currentPrice = 1.2640;

  const movements = [
    0.0008, 0.0011, 0.0009, -0.0004, 0.0012, 0.0007, -0.0008, -0.0010, -0.0007, 0.0002,
    0.0012, 0.0015, 0.0014, -0.0005, 0.0016, -0.0011, -0.0014, -0.0013, -0.0012, 0.0003,
    0.0009, 0.0011, 0.0008, -0.0004, -0.0009, -0.0012, -0.0015, -0.0018, -0.0014, -0.0011,
    -0.0014, -0.0018, -0.0012, 0.0004, -0.0015, -0.0019, -0.0013, 0.0005, -0.0016, -0.0014,
    -0.0011, -0.0009, 0.0004, -0.0012, -0.0015, -0.0010, 0.0003, -0.0011, -0.0008, -0.0006
  ];

  for (let i = 0; i < movements.length; i++) {
    const move = movements[i];
    const open = Math.round(currentPrice * 100000) / 100000;
    const close = Math.round((open + move) * 100000) / 100000;
    const maxVal = Math.max(open, close);
    const minVal = Math.min(open, close);
    const high = Math.round((maxVal + Math.random() * 0.0005 + 0.0001) * 100000) / 100000;
    const low = Math.round((minVal - Math.random() * 0.0005 - 0.0001) * 100000) / 100000;
    const volume = Math.round(1400 + Math.random() * 2000);

    const ts = baseTime + i * 3600;
    const d = new Date(ts * 1000);
    const timeStr = `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:00`;

    candles.push({ time: timeStr, timestamp: ts, open, high, low, close, volume });
    currentPrice = close;
  }
  return candles;
}

// 3. USD/JPY: Range Boundary Consolidation
function generateUsdJpy(): Candle[] {
  const baseTime = 1715400000;
  const candles: Candle[] = [];
  let currentPrice = 150.20;

  const movements = [
    0.15, 0.22, 0.18, -0.12, 0.25, 0.19, -0.22, -0.28, -0.21, 0.08,
    -0.19, -0.24, 0.11, 0.23, 0.27, 0.16, -0.14, -0.22, -0.26, 0.09,
    0.18, 0.22, 0.25, -0.11, -0.18, -0.25, -0.21, 0.14, 0.19, 0.22,
    -0.12, -0.24, -0.19, 0.15, 0.21, 0.18, -0.20, -0.25, 0.12, 0.18
  ];

  for (let i = 0; i < movements.length; i++) {
    const move = movements[i];
    const open = Math.round(currentPrice * 100) / 100;
    const close = Math.round((open + move) * 100) / 100;
    const maxVal = Math.max(open, close);
    const minVal = Math.min(open, close);
    const high = Math.round((maxVal + Math.random() * 0.12 + 0.02) * 100) / 100;
    const low = Math.round((minVal - Math.random() * 0.12 - 0.02) * 100) / 100;
    const volume = Math.round(2000 + Math.random() * 2500);

    const ts = baseTime + i * 3600;
    const d = new Date(ts * 1000);
    const timeStr = `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:00`;

    candles.push({ time: timeStr, timestamp: ts, open, high, low, close, volume });
    currentPrice = close;
  }
  return candles;
}

// 4. XAU/USD (Gold): London Session Breakout & Momentum Expansion
function generateGold(): Candle[] {
  const baseTime = 1715600000;
  const candles: Candle[] = [];
  let currentPrice = 2320.50;

  const movements = [
    // Pre-London compression
    0.8, -1.2, 0.5, -0.4, 0.9, -0.7, 0.3, -0.2, 0.6, -0.5,
    // London open volume surge and breakout past 2328
    2.4, 4.8, 3.2, -1.1, 5.5, 4.2, -1.8, 3.9, 6.2, 4.5,
    // Pullback to 2342
    -2.1, -3.2, -1.8, 1.2, 0.8, 2.1,
    // Multi-bar run up to 2368
    3.8, 4.5, 5.2, -1.5, 4.8, 6.1, 3.9, -1.2, 4.4, 5.0, 3.1
  ];

  for (let i = 0; i < movements.length; i++) {
    const move = movements[i];
    const open = Math.round(currentPrice * 10) / 10;
    const close = Math.round((open + move) * 10) / 10;
    const maxVal = Math.max(open, close);
    const minVal = Math.min(open, close);
    const high = Math.round((maxVal + Math.random() * 1.5 + 0.3) * 10) / 10;
    const low = Math.round((minVal - Math.random() * 1.5 - 0.3) * 10) / 10;
    const volume = Math.round(3000 + Math.random() * 4500 + Math.abs(move) * 800);

    const ts = baseTime + i * 3600;
    const d = new Date(ts * 1000);
    const timeStr = `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:00`;

    candles.push({ time: timeStr, timestamp: ts, open, high, low, close, volume });
    currentPrice = close;
  }
  return candles;
}

// 5. BTC/USD (Bitcoin): Moving Average Mean Reversion
function generateBitcoin(): Candle[] {
  const baseTime = 1715800000;
  const candles: Candle[] = [];
  let currentPrice = 64200.0;

  const movements = [
    120, -180, 240, -150, 310, -220, 180, -90,
    // Sell-off sweep into support at 63,500
    -350, -480, -620, -290, 150, -180, 80, 240,
    // Aggressive V-reversal rally past 66,000
    450, 680, 520, -180, 710, 840, -220, 590, 620, 480, -150, 410, 320
  ];

  for (let i = 0; i < movements.length; i++) {
    const move = movements[i];
    const open = Math.round(currentPrice);
    const close = Math.round(open + move);
    const maxVal = Math.max(open, close);
    const minVal = Math.min(open, close);
    const high = Math.round(maxVal + Math.random() * 120 + 20);
    const low = Math.round(minVal - Math.random() * 120 - 20);
    const volume = Math.round(5000 + Math.random() * 8000);

    const ts = baseTime + i * 3600;
    const d = new Date(ts * 1000);
    const timeStr = `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:00`;

    candles.push({ time: timeStr, timestamp: ts, open, high, low, close, volume });
    currentPrice = close;
  }
  return candles;
}

export const REPLAY_INSTRUMENTS: Instrument[] = [
  {
    symbol: "EUR/USD",
    name: "Euro / US Dollar",
    category: "Forex Major",
    pipSize: 0.0001,
    pipValueStandard: 10.0,
    defaultSpread: 1.1,
    commissionPerLot: 3.0,
    description: "The most liquid currency pair globally, reflecting European vs US macroeconomic flows.",
    scenarioTitle: "Support Retest & Trend Continuation Lab",
    scenarioDescription: "Analyze a resistance breakout followed by a healthy pullback to support. Identify risk-defined entry points with minimum 1:2 Reward-to-Risk.",
    initialReplayIndex: 42,
    candles: generateEurUsd(),
  },
  {
    symbol: "GBP/USD",
    name: "British Pound / US Dollar",
    category: "Forex Major",
    pipSize: 0.0001,
    pipValueStandard: 10.0,
    defaultSpread: 1.4,
    commissionPerLot: 3.0,
    description: "Known as 'Cable', featuring higher intraday momentum and sharp structural distribution.",
    scenarioTitle: "Head & Shoulders Reversal Structure Lab",
    scenarioDescription: "Observe institutional distribution forming a multi-peak reversal. Practice positioning with stop losses above the right shoulder.",
    initialReplayIndex: 26,
    candles: generateGbpUsd(),
  },
  {
    symbol: "USD/JPY",
    name: "US Dollar / Japanese Yen",
    category: "Forex Major",
    pipSize: 0.01,
    pipValueStandard: 6.65,
    defaultSpread: 1.2,
    commissionPerLot: 3.0,
    description: "Highly sensitive to US Treasury yields and Bank of Japan monetary policy shifts.",
    scenarioTitle: "Horizontal Range Boundary Execution Lab",
    scenarioDescription: "Identify recurring support and resistance boundaries in a 140-pip consolidation channel.",
    initialReplayIndex: 18,
    candles: generateUsdJpy(),
  },
  {
    symbol: "XAU/USD",
    name: "Gold / US Dollar",
    category: "Commodities",
    pipSize: 0.1,
    pipValueStandard: 10.0,
    defaultSpread: 2.0,
    commissionPerLot: 3.5,
    description: "High-beta commodity sensitive to inflation forecasts, central bank reserves, and safe-haven liquidity.",
    scenarioTitle: "London Breakout & Momentum Expansion Lab",
    scenarioDescription: "Witness pre-market range compression exploding into a sustained London session rally. Practice trailing stops on runaway trends.",
    initialReplayIndex: 10,
    candles: generateGold(),
  },
  {
    symbol: "BTC/USD",
    name: "Bitcoin / US Dollar",
    category: "Crypto",
    pipSize: 1.0,
    pipValueStandard: 1.0,
    defaultSpread: 5.0,
    commissionPerLot: 4.0,
    description: "24/7 digital asset experiencing aggressive liquidity sweeps and sharp V-shaped mean-reversion impulses.",
    scenarioTitle: "Support Sweep & Mean Reversion Lab",
    scenarioDescription: "Examine a false breakdown below psychological support followed by an aggressive short squeeze reversal.",
    initialReplayIndex: 12,
    candles: generateBitcoin(),
  },
];

export const SIMULATION_CHALLENGES: SimulationChallenge[] = [
  {
    id: "chal-london-breakout",
    title: "Challenge 1: The London Session Breakout",
    difficulty: "Beginner",
    targetR: 2.0,
    maxRiskPercent: 1.0,
    description: "Gold (XAU/USD) is consolidating tightly before the London market open. Position with a maximum 1% risk budget and capture at least a 1:2 Reward-to-Risk target.",
    winCondition: "Execute a simulated BUY order with Stop Loss placed below range low and capture +2R profit.",
    hint: "Notice how volume shrinks during Asian hours. Look for the first 15M candle closing decisively above resistance.",
    recommendedInstrument: "XAU/USD",
    initialIndex: 10,
  },
  {
    id: "chal-support-retest",
    title: "Challenge 2: The Textbook Support Retest",
    difficulty: "Intermediate",
    targetR: 2.5,
    maxRiskPercent: 1.0,
    description: "EUR/USD broke through major resistance at 1.0850 and is currently pulling back to test the previous high as new support. Time your entry precisely.",
    winCondition: "Enter after observing a bullish candlestick rejection at support with Stop Loss within 20 pips.",
    hint: "Wait for the retest candle to close. Entering prematurely before confirmation exposes you to false breakout traps.",
    recommendedInstrument: "EUR/USD",
    initialIndex: 42,
  },
  {
    id: "chal-reversal-distribution",
    title: "Challenge 3: Right Shoulder Short Distribution",
    difficulty: "Advanced",
    targetR: 3.0,
    maxRiskPercent: 1.5,
    description: "GBP/USD created a Head & Shoulders top. The right shoulder is forming at 1.2730 with lower volume. Execute a defensive short position.",
    winCondition: "Place a SELL order with Stop Loss above the right shoulder peak and manage the position down to the neckline breakdown.",
    hint: "Your invalidation level is crystal clear: if price breaches the right shoulder high, the pattern is void.",
    recommendedInstrument: "GBP/USD",
    initialIndex: 26,
  },
];
