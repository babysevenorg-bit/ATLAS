"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  Percent,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  DollarSign,
  HelpCircle,
  BarChart3,
  Flame,
  Gauge,
  Scissors,
  Network,
  Zap,
} from "lucide-react";

export default function RiskLaboratory() {
  const [activeTab, setActiveTab] = useState<
    | "position_sizing"
    | "ruin_simulator"
    | "rr_matrix"
    | "drawdown_curve"
    | "leverage_margin"
    | "spread_slippage"
    | "correlation_risk"
  >("position_sizing");

  // Tab 1: Position Sizing State
  const [balance, setBalance] = useState("10000");
  const [riskPercent, setRiskPercent] = useState("1.0");
  const [stopPips, setStopPips] = useState("25");
  const [pair, setPair] = useState("EUR/USD");
  const [lotType, setLotType] = useState<"standard" | "mini" | "micro">("standard");

  // Tab 2: Ruin & Losing Streak State
  const [strategyWinRate, setStrategyWinRate] = useState("50");
  const [simulatedTradesCount, setSimulatedTradesCount] = useState("30");
  const [streakRiskPercent, setStreakRiskPercent] = useState("2.0");

  // Tab 3: R:R Expectancy State
  const [rrRatio, setRrRatio] = useState("2.0"); // 1:2
  const [expWinRate, setExpWinRate] = useState("45");

  // Tab 4: Drawdown Recovery State
  const [drawdownPercent, setDrawdownPercent] = useState("30");

  // Tab 5: Leverage & Margin Call State
  const [levBalance, setLevBalance] = useState("10000");
  const [leverageRatio, setLeverageRatio] = useState("30");
  const [levLots, setLevLots] = useState("1.0");
  const [levSymbol, setLevSymbol] = useState("EUR/USD");
  const [priceMovePips, setPriceMovePips] = useState("50");

  // Tab 6: Spread & Slippage Cost State
  const [spreadPips, setSpreadPips] = useState("1.5");
  const [slippagePips, setSlippagePips] = useState("0.5");
  const [commissionPerLot, setCommissionPerLot] = useState("7.0");
  const [tradesPerMonth, setTradesPerMonth] = useState("20");
  const [costLotSize, setCostLotSize] = useState("1.0");

  // Tab 7: Correlation Risk State
  const [portfolioPositions, setPortfolioPositions] = useState<
    { symbol: string; lots: number; direction: "BUY" | "SELL" }[]
  >([
    { symbol: "EUR/USD", lots: 1.0, direction: "BUY" },
    { symbol: "GBP/USD", lots: 0.8, direction: "BUY" },
    { symbol: "USD/JPY", lots: 0.5, direction: "SELL" },
  ]);

  // --- Calculations for Tab 1 (Position Sizing) ---
  const numBalance = Math.max(0, Number(balance) || 10000);
  const numRiskPercent = Math.max(0.1, Math.min(10, Number(riskPercent) || 1));
  const numStopPips = Math.max(1, Number(stopPips) || 25);
  const riskDollarBudget = (numBalance * numRiskPercent) / 100;

  const pipValue = pair.includes("JPY") ? 6.65 : 10.0;
  const standardLots = numStopPips > 0 ? riskDollarBudget / (numStopPips * pipValue) : 0;
  const miniLots = standardLots * 10;
  const microLots = standardLots * 100;
  const approximateMargin = (standardLots * 100000) / 30; // 1:30 leverage

  // --- Calculations for Tab 2 (Losing Streak Probability) ---
  const winRateProb = Math.max(0.1, Math.min(0.95, (Number(strategyWinRate) || 50) / 100));
  const lossProb = 1 - winRateProb;
  const numTrades = Number(simulatedTradesCount) || 30;

  // Probability of at least one streak of length K in N trades (Approximate Markov/binomial formula)
  const probStreak3 = Math.min(100, Math.round((1 - Math.pow(1 - Math.pow(lossProb, 3), numTrades / 3)) * 100));
  const probStreak5 = Math.min(100, Math.round((1 - Math.pow(1 - Math.pow(lossProb, 5), numTrades / 5)) * 100));
  const probStreak8 = Math.min(100, Math.round((1 - Math.pow(1 - Math.pow(lossProb, 8), numTrades / 8)) * 100));

  const totalLossIn5Streak = Math.round((1 - Math.pow(1 - (Number(streakRiskPercent) || 2) / 100, 5)) * 1000) / 10;

  // --- Calculations for Tab 3 (R:R & Expectancy) ---
  const numRr = Number(rrRatio) || 2.0;
  const numExpWinRate = Number(expWinRate) || 45;
  const requiredBreakEvenWinRate = Math.round((1 / (1 + numRr)) * 1000) / 10;
  const expectancy = ((numExpWinRate / 100) * numRr) - (((100 - numExpWinRate) / 100) * 1.0);

  // --- Calculations for Tab 4 (Drawdown Recovery) ---
  const numDd = Number(drawdownPercent) || 30;
  const requiredRecoveryPercent = numDd < 100 ? Math.round(((numDd / (100 - numDd)) * 100) * 10) / 10 : 9999;
  const remainingCapital = numBalance * (1 - numDd / 100);

  // --- Calculations for Tab 5 (Leverage & Margin Call) ---
  const numLevBalance = Math.max(100, Number(levBalance) || 10000);
  const numLeverage = Math.max(1, Math.min(500, Number(leverageRatio) || 30));
  const numLevLots = Math.max(0.01, Number(levLots) || 1.0);
  const numPriceMovePips = Number(priceMovePips) || 50;
  const notionalValue = numLevLots * 100000; // standard lot = 100k units
  const requiredMargin = notionalValue / numLeverage;
  const marginUsagePct = (requiredMargin / numLevBalance) * 100;
  const isMarginCallLikely = requiredMargin > numLevBalance;
  // Pip value ~$10 per standard lot for USD-quoted pairs
  const pipValueUsd = levSymbol.includes("JPY") ? 1000 / 150 : 10;
  const pipValueForLots = numLevLots * pipValueUsd;
  const pnlOnAdverseMove = -numPriceMovePips * pipValueForLots;
  const equityAfterAdverseMove = numLevBalance + pnlOnAdverseMove;
  const marginLevelAfter = equityAfterAdverseMove > 0 ? (equityAfterAdverseMove / requiredMargin) * 100 : 0;
  const marginCallTriggered = marginLevelAfter < 100 && requiredMargin > 0;
  const stopOutTriggered = marginLevelAfter < 50 && requiredMargin > 0;

  // --- Calculations for Tab 6 (Spread & Slippage) ---
  const numSpreadPips = Math.max(0, Number(spreadPips) || 0);
  const numSlippagePips = Math.max(0, Number(slippagePips) || 0);
  const numCommission = Math.max(0, Number(commissionPerLot) || 0);
  const numTradesPerMonth = Math.max(1, Number(tradesPerMonth) || 20);
  const numCostLots = Math.max(0.01, Number(costLotSize) || 1.0);
  const costPerTrade = (numSpreadPips + numSlippagePips) * numCostLots * 10 + numCommission * numCostLots;
  const monthlyCost = costPerTrade * numTradesPerMonth;
  const annualCost = monthlyCost * 12;
  const annualCostPctOfBalance = (annualCost / numBalance) * 100;
  // Break-even win rate uplift required: each trade starts at -costPerTrade
  // For 1:2 R:R with $100 risk budget, breakeven moves from 33.3% → (1 + cost/risk) / (1 + R + cost/risk)
  const riskBudgetPerTrade = numBalance * 0.01; // 1% risk assumption
  const costAsPctOfRisk = (costPerTrade / riskBudgetPerTrade) * 100;

  // --- Calculations for Tab 7 (Correlation Risk) ---
  // Synthetic correlation matrix (educational approximation)
  const correlationMatrix: Record<string, Record<string, number>> = {
    "EUR/USD": { "EUR/USD": 1.0, "GBP/USD": 0.75, "USD/JPY": -0.65, "AUD/USD": 0.55, "XAU/USD": 0.35 },
    "GBP/USD": { "EUR/USD": 0.75, "GBP/USD": 1.0, "USD/JPY": -0.55, "AUD/USD": 0.45, "XAU/USD": 0.25 },
    "USD/JPY": { "EUR/USD": -0.65, "GBP/USD": -0.55, "USD/JPY": 1.0, "AUD/USD": -0.45, "XAU/USD": -0.30 },
    "AUD/USD": { "EUR/USD": 0.55, "GBP/USD": 0.45, "USD/JPY": -0.45, "AUD/USD": 1.0, "XAU/USD": 0.40 },
    "XAU/USD": { "EUR/USD": 0.35, "GBP/USD": 0.25, "USD/JPY": -0.30, "AUD/USD": 0.40, "XAU/USD": 1.0 },
  };
  // Calculate effective risk: with correlated positions, total risk > sum if same direction on correlated pairs
  const positionRisks = portfolioPositions.map(p => ({ ...p, riskPct: p.lots * 0.5 })); // 0.5% per lot baseline
  const naiveRiskSum = positionRisks.reduce((s, p) => s + p.riskPct, 0);
  // Effective portfolio variance using correlation
  let portfolioVariance = 0;
  for (let i = 0; i < positionRisks.length; i++) {
    for (let j = 0; j < positionRisks.length; j++) {
      const ri = positionRisks[i].riskPct;
      const rj = positionRisks[j].riskPct;
      const corr = correlationMatrix[positionRisks[i].symbol]?.[positionRisks[j].symbol] ?? 0;
      const dirSign = positionRisks[i].direction === positionRisks[j].direction ? 1 : -1;
      portfolioVariance += ri * rj * corr * dirSign;
    }
  }
  const effectiveRisk = Math.sqrt(Math.max(0, portfolioVariance));
  const riskAmplification = naiveRiskSum > 0 ? effectiveRisk / naiveRiskSum : 1;
  const diversificationBenefit = Math.max(0, naiveRiskSum - effectiveRisk);
  const isOverconcentrated = riskAmplification > 0.9 && portfolioPositions.length > 1;

  return (
    <div className="risk-lab-container">
      {/* Risk Lab Header */}
      <div className="risk-lab-header">
        <div className="header-left">
          <div className="kicker-badge">
            <ShieldCheck size={15} /> RISK MANAGEMENT LABORATORY
          </div>
          <h2>Quantify & Protect Your Virtual Capital</h2>
          <p>
            Risk management is not an afterthought—it is the math that determines whether a trader survives to see tomorrow.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="risk-tabs-pills">
          <button
            onClick={() => setActiveTab("position_sizing")}
            className={`risk-tab-btn ${activeTab === "position_sizing" ? "active" : ""}`}
          >
            <Calculator size={16} /> Position Sizing
          </button>
          <button
            onClick={() => setActiveTab("ruin_simulator")}
            className={`risk-tab-btn ${activeTab === "ruin_simulator" ? "active" : ""}`}
          >
            <Flame size={16} /> Losing Streaks
          </button>
          <button
            onClick={() => setActiveTab("rr_matrix")}
            className={`risk-tab-btn ${activeTab === "rr_matrix" ? "active" : ""}`}
          >
            <BarChart3 size={16} /> R:R Expectancy
          </button>
          <button
            onClick={() => setActiveTab("drawdown_curve")}
            className={`risk-tab-btn ${activeTab === "drawdown_curve" ? "active" : ""}`}
          >
            <TrendingDown size={16} /> Drawdown Curve
          </button>
          <button
            onClick={() => setActiveTab("leverage_margin")}
            className={`risk-tab-btn ${activeTab === "leverage_margin" ? "active" : ""}`}
          >
            <Gauge size={16} /> Leverage & Margin
          </button>
          <button
            onClick={() => setActiveTab("spread_slippage")}
            className={`risk-tab-btn ${activeTab === "spread_slippage" ? "active" : ""}`}
          >
            <Scissors size={16} /> Spread & Slippage
          </button>
          <button
            onClick={() => setActiveTab("correlation_risk")}
            className={`risk-tab-btn ${activeTab === "correlation_risk" ? "active" : ""}`}
          >
            <Network size={16} /> Correlation Risk
          </button>
        </div>
      </div>

      {/* TAB 1: Position Sizing & Lot Calculator */}
      {activeTab === "position_sizing" && (
        <div className="risk-grid-layout">
          <div className="risk-card input-card">
            <h3>1. Enter Trade Assumptions</h3>
            <p className="card-desc">Calculate exact lot sizes tailored to your technical stop distance.</p>

            <div className="risk-fields-grid">
              <label>
                <span>Virtual Account Balance ($)</span>
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={balance}
                  onChange={e => setBalance(e.target.value)}
                />
              </label>

              <label>
                <span>Planned Risk Per Trade (%)</span>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.5"
                  value={riskPercent}
                  onChange={e => setRiskPercent(e.target.value)}
                />
              </label>

              <label>
                <span>Technical Stop Loss (Pips)</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={stopPips}
                  onChange={e => setStopPips(e.target.value)}
                />
              </label>

              <label>
                <span>Currency Pair</span>
                <select value={pair} onChange={e => setPair(e.target.value)}>
                  <option value="EUR/USD">EUR/USD ($10.00 / pip / lot)</option>
                  <option value="GBP/USD">GBP/USD ($10.00 / pip / lot)</option>
                  <option value="USD/JPY">USD/JPY (~$6.65 / pip / lot)</option>
                  <option value="AUD/USD">AUD/USD ($10.00 / pip / lot)</option>
                </select>
              </label>
            </div>

            <div className="formula-callout">
              <strong>The Golden Position Sizing Formula:</strong>
              <code>Lots = Risk Budget ($) ÷ [Stop Distance (Pips) × Pip Value ($)]</code>
            </div>
          </div>

          <div className="risk-card output-card">
            <h3>2. Calculated Lot Allocation</h3>
            <div className="primary-output-box">
              <span>RECOMMENDED TRADE SIZE</span>
              <strong>{standardLots.toFixed(2)} <small>Standard Lots</small></strong>
              <p>Controls ${(standardLots * 100000).toLocaleString()} nominal currency</p>
            </div>

            <div className="output-specs-list">
              <div className="spec-row">
                <span>Maximum Risk Capital:</span>
                <strong>${riskDollarBudget.toFixed(2)} ({numRiskPercent}%)</strong>
              </div>
              <div className="spec-row">
                <span>Mini Lots Equivalent:</span>
                <strong>{miniLots.toFixed(1)} Mini Lots (10k units)</strong>
              </div>
              <div className="spec-row">
                <span>Micro Lots Equivalent:</span>
                <strong>{microLots.toFixed(0)} Micro Lots (1k units)</strong>
              </div>
              <div className="spec-row">
                <span>Approximate Required Margin (1:30):</span>
                <strong>${approximateMargin.toFixed(2)}</strong>
              </div>
            </div>

            <div className="safety-badge">
              <ShieldCheck size={16} />
              <span>
                Even if your stop is hit, you will lose exactly ${riskDollarBudget.toFixed(2)} (excluding spread/slippage).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Losing Streak & Risk of Ruin Simulator */}
      {activeTab === "ruin_simulator" && (
        <div className="risk-grid-layout">
          <div className="risk-card input-card">
            <h3>Losing Streak Probability Model</h3>
            <p className="card-desc">
              Understand why even high win-rate strategies suffer inevitable consecutive losing runs over sample sizes.
            </p>

            <div className="risk-fields-grid">
              <label>
                <span>Strategy Win Rate (%):</span>
                <input
                  type="number"
                  min="20"
                  max="90"
                  step="5"
                  value={strategyWinRate}
                  onChange={e => setStrategyWinRate(e.target.value)}
                />
              </label>

              <label>
                <span>Sample Size (Number of Trades):</span>
                <input
                  type="number"
                  min="10"
                  max="200"
                  step="10"
                  value={simulatedTradesCount}
                  onChange={e => setSimulatedTradesCount(e.target.value)}
                />
              </label>

              <label>
                <span>Risk Per Trade (%):</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  value={streakRiskPercent}
                  onChange={e => setStreakRiskPercent(e.target.value)}
                />
              </label>
            </div>

            <div className="streak-warning-box">
              <AlertTriangle size={18} />
              <span>
                If you risk {streakRiskPercent}% per trade, a 5-trade losing streak reduces your account by <strong>{totalLossIn5Streak}%</strong>!
              </span>
            </div>
          </div>

          <div className="risk-card output-card">
            <h3>Probability Over {numTrades} Trades</h3>
            <div className="streak-bars-list">
              <div className="streak-bar-item">
                <div className="streak-label">
                  <span>3 Losses in a Row</span>
                  <strong>{probStreak3}% Chance</strong>
                </div>
                <div className="streak-track">
                  <div style={{ width: `${probStreak3}%`, background: "#ffd43b" }} />
                </div>
              </div>

              <div className="streak-bar-item">
                <div className="streak-label">
                  <span>5 Losses in a Row</span>
                  <strong>{probStreak5}% Chance</strong>
                </div>
                <div className="streak-track">
                  <div style={{ width: `${probStreak5}%`, background: "#ff922b" }} />
                </div>
              </div>

              <div className="streak-bar-item">
                <div className="streak-label">
                  <span>8 Losses in a Row</span>
                  <strong>{probStreak8}% Chance</strong>
                </div>
                <div className="streak-track">
                  <div style={{ width: `${probStreak8}%`, background: "#fa5252" }} />
                </div>
              </div>
            </div>

            <div className="insight-card">
              <Sparkles size={16} />
              <p>
                Conclusion: In any 50-trade sample, experiencing 4-5 consecutive losses is a statistical near-certainty. Traders who risk 10% per trade blow up; traders who risk 1% endure with ease.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Reward-to-Risk & Expectancy Matrix */}
      {activeTab === "rr_matrix" && (
        <div className="risk-grid-layout">
          <div className="risk-card input-card">
            <h3>Reward-to-Risk & Mathematical Expectancy</h3>
            <p className="card-desc">
              Test how asymmetrical payoffs allow profitable systems with modest win rates.
            </p>

            <div className="risk-fields-grid">
              <label>
                <span>Reward-to-Risk Ratio (1 : X):</span>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={rrRatio}
                  onChange={e => setRrRatio(e.target.value)}
                />
              </label>

              <label>
                <span>Strategy Win Rate (%):</span>
                <input
                  type="number"
                  min="10"
                  max="90"
                  step="5"
                  value={expWinRate}
                  onChange={e => setExpWinRate(e.target.value)}
                />
              </label>
            </div>

            <div className="rr-matrix-table">
              <h4>Break-Even Win Rate Matrix:</h4>
              <div className="matrix-row">
                <span>1 : 1.0 (Risk $1 to make $1)</span>
                <strong>50.0% Required Win Rate</strong>
              </div>
              <div className="matrix-row active">
                <span>1 : 2.0 (Risk $1 to make $2)</span>
                <strong>33.3% Required Win Rate</strong>
              </div>
              <div className="matrix-row">
                <span>1 : 3.0 (Risk $1 to make $3)</span>
                <strong>25.0% Required Win Rate</strong>
              </div>
            </div>
          </div>

          <div className="risk-card output-card">
            <h3>Expectancy Score</h3>
            <div className="primary-output-box">
              <span>EXPECTED RETURN PER $1 RISK</span>
              <strong style={{ color: expectancy >= 0 ? "#69db7c" : "#ff8787" }}>
                {expectancy >= 0 ? `+${expectancy.toFixed(2)}R` : `${expectancy.toFixed(2)}R`}
              </strong>
              <p>
                {expectancy >= 0 ? "Positive Mathematical Edge (+EV)" : "Negative Mathematical Expectancy (-EV)"}
              </p>
            </div>

            <div className="output-specs-list">
              <div className="spec-row">
                <span>Your Win Rate:</span>
                <strong>{numExpWinRate}%</strong>
              </div>
              <div className="spec-row">
                <span>Minimum Break-Even Needed:</span>
                <strong>{requiredBreakEvenWinRate}%</strong>
              </div>
            </div>

            <div className="insight-card">
              <Info size={16} />
              <p>
                With a 1:2 R:R, winning just 45% of trades generates an excellent +0.35R positive edge per trade!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Drawdown Curve & Recovery Mathematics */}
      {activeTab === "drawdown_curve" && (
        <div className="risk-grid-layout">
          <div className="risk-card input-card">
            <h3>The Drawdown Asymmetry Trap</h3>
            <p className="card-desc">
              Adjust the slider to witness how recovering lost capital demands exponential returns.
            </p>

            <div className="drawdown-slider-box">
              <div className="slider-labels">
                <span>Account Drawdown:</span>
                <strong>{drawdownPercent}% Loss</strong>
              </div>
              <input
                type="range"
                min="5"
                max="90"
                step="5"
                value={drawdownPercent}
                onChange={e => setDrawdownPercent(e.target.value)}
                className="range-slider"
              />
            </div>

            <div className="dd-asymmetry-table">
              <div className="dd-row"><span>10% Loss</span> <strong>Requires +11.1% Gain</strong></div>
              <div className="dd-row"><span>20% Loss</span> <strong>Requires +25.0% Gain</strong></div>
              <div className="dd-row active"><span>50% Loss</span> <strong>Requires +100.0% Gain (Double Capital!)</strong></div>
              <div className="dd-row danger"><span>80% Loss</span> <strong>Requires +400.0% Gain</strong></div>
            </div>
          </div>

          <div className="risk-card output-card">
            <h3>Recovery Required</h3>
            <div className="primary-output-box">
              <span>RETURN ON REMAINING CAPITAL NEEDED</span>
              <strong style={{ color: numDd >= 50 ? "#fa5252" : "#ffd43b" }}>
                +{requiredRecoveryPercent.toFixed(1)}%
              </strong>
              <p>Remaining Capital: ${remainingCapital.toLocaleString()}</p>
            </div>

            <div className="danger-zone-card">
              <AlertTriangle size={18} />
              <p>
                {numDd >= 50
                  ? "CRITICAL DANGER ZONE: Once an account is down 50%+, emotional panic and revenge trading multiply, making recovery mathematically and psychologically improbable."
                  : "SAFE RECOVERY ZONE: Keep drawdowns under 15-20% to ensure recovery requires modest, achievable market gains."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Leverage & Margin Call Simulator */}
      {activeTab === "leverage_margin" && (
        <div className="risk-grid-layout">
          <div className="risk-card input-card">
            <h3>Leverage & Margin Call Visualizer</h3>
            <p className="card-desc">
              Leverage amplifies both gains and losses. Adjust the ratio to see how a routine adverse price move triggers margin calls and forced liquidation.
            </p>

            <div className="risk-fields-grid">
              <label>
                <span>Virtual Account Balance ($)</span>
                <input type="number" min="100" step="500" value={levBalance} onChange={e => setLevBalance(e.target.value)} />
              </label>
              <label>
                <span>Leverage Ratio (1 : X)</span>
                <select value={leverageRatio} onChange={e => setLeverageRatio(e.target.value)}>
                  <option value="1">1:1 (No leverage)</option>
                  <option value="5">1:5 (Conservative)</option>
                  <option value="10">1:10</option>
                  <option value="30">1:30 (EU Retail Cap)</option>
                  <option value="50">1:50 (US Forex)</option>
                  <option value="100">1:100</option>
                  <option value="200">1:200</option>
                  <option value="500">1:500 (Offshore)</option>
                </select>
              </label>
              <label>
                <span>Position Size (Lots)</span>
                <input type="number" min="0.01" step="0.1" value={levLots} onChange={e => setLevLots(e.target.value)} />
              </label>
              <label>
                <span>Adverse Price Move (Pips)</span>
                <input type="number" min="1" max="500" step="5" value={priceMovePips} onChange={e => setPriceMovePips(e.target.value)} />
              </label>
              <label>
                <span>Instrument</span>
                <select value={levSymbol} onChange={e => setLevSymbol(e.target.value)}>
                  <option value="EUR/USD">EUR/USD</option>
                  <option value="GBP/USD">GBP/USD</option>
                  <option value="USD/JPY">USD/JPY</option>
                  <option value="AUD/USD">AUD/USD</option>
                </select>
              </label>
            </div>

            <div className="formula-callout">
              <strong>Notional Value = Lots × 100,000</strong>
              <code>Required Margin = Notional ÷ Leverage | Margin Level % = Equity ÷ Required Margin × 100</code>
            </div>
          </div>

          <div className="risk-card output-card">
            <h3>Margin Stress Test</h3>
            <div className="primary-output-box">
              <span>REQUIRED MARGIN</span>
              <strong style={{ color: marginUsagePct > 100 ? "#ff8787" : "#c9ed85" }}>
                ${requiredMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </strong>
              <p>{marginUsagePct.toFixed(1)}% of your equity locked as margin</p>
            </div>

            <div className="output-specs-list">
              <div className="spec-row">
                <span>Notional Position Value:</span>
                <strong>${notionalValue.toLocaleString()}</strong>
              </div>
              <div className="spec-row">
                <span>Pip Value (per pip):</span>
                <strong>${pipValueForLots.toFixed(2)}</strong>
              </div>
              <div className="spec-row">
                <span>P&L on {numPriceMovePips}-pip adverse move:</span>
                <strong style={{ color: pnlOnAdverseMove < -100 ? "#ff8787" : "#ffd43b" }}>
                  ${pnlOnAdverseMove.toFixed(2)}
                </strong>
              </div>
              <div className="spec-row">
                <span>Equity After Adverse Move:</span>
                <strong style={{ color: equityAfterAdverseMove < 0 ? "#ff8787" : "white" }}>
                  ${equityAfterAdverseMove.toFixed(2)}
                </strong>
              </div>
              <div className="spec-row">
                <span>Margin Level After Move:</span>
                <strong style={{ color: marginLevelAfter < 100 ? "#ff8787" : marginLevelAfter < 200 ? "#ffd43b" : "#c9ed85" }}>
                  {marginLevelAfter.toFixed(1)}%
                </strong>
              </div>
            </div>

            {marginCallTriggered ? (
              <div className="safety-badge" style={{ background: "#5a1a1a", color: "#ffd0d0" }}>
                <AlertTriangle size={16} />
                <span>
                  <strong>MARGIN CALL TRIGGERED.</strong> Margin level fell below 100%. Broker demands additional deposit or your position will be force-liquidated.
                </span>
              </div>
            ) : (
              <div className="safety-badge">
                <ShieldCheck size={16} />
                <span>
                  Margin level remains above 100% after the adverse move. Account survives this scenario.
                </span>
              </div>
            )}

            {stopOutTriggered && (
              <div className="safety-badge" style={{ background: "#7a1010", color: "#ffe0e0", marginTop: 8 }}>
                <Zap size={16} />
                <span>
                  <strong>STOP-OUT EXECUTED.</strong> Margin level under 50% — broker forcibly closed your position at market price. Loss locked in.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: Spread & Slippage Cost Analyzer */}
      {activeTab === "spread_slippage" && (
        <div className="risk-grid-layout">
          <div className="risk-card input-card">
            <h3>Transaction Cost Erosion Analyzer</h3>
            <p className="card-desc">
              Every trade pays a hidden tax: spread, slippage, and commission. These silent costs reshape your break-even win rate — often invisibly eroding otherwise profitable strategies.
            </p>

            <div className="risk-fields-grid">
              <label>
                <span>Spread (Pips)</span>
                <input type="number" min="0" step="0.1" value={spreadPips} onChange={e => setSpreadPips(e.target.value)} />
              </label>
              <label>
                <span>Slippage (Pips)</span>
                <input type="number" min="0" step="0.1" value={slippagePips} onChange={e => setSlippagePips(e.target.value)} />
              </label>
              <label>
                <span>Commission ($/Lot round-trip)</span>
                <input type="number" min="0" step="0.5" value={commissionPerLot} onChange={e => setCommissionPerLot(e.target.value)} />
              </label>
              <label>
                <span>Trades per Month</span>
                <input type="number" min="1" step="5" value={tradesPerMonth} onChange={e => setTradesPerMonth(e.target.value)} />
              </label>
              <label>
                <span>Lot Size per Trade</span>
                <input type="number" min="0.01" step="0.1" value={costLotSize} onChange={e => setCostLotSize(e.target.value)} />
              </label>
              <label>
                <span>Reference Balance ($)</span>
                <input type="number" min="100" step="500" value={balance} onChange={e => setBalance(e.target.value)} />
              </label>
            </div>

            <div className="formula-callout">
              <strong>Cost Per Trade = (Spread + Slippage) × Pip Value × Lots + Commission × Lots</strong>
              <code>Monthly Drain = Cost × Trades | Annual % = (Annual Cost ÷ Balance) × 100</code>
            </div>
          </div>

          <div className="risk-card output-card">
            <h3>Transaction Cost Audit</h3>
            <div className="primary-output-box">
              <span>COST PER TRADE</span>
              <strong style={{ color: costPerTrade > 20 ? "#ff8787" : "#ffd43b" }}>
                ${costPerTrade.toFixed(2)}
              </strong>
              <p>Round-trip cost on every executed trade</p>
            </div>

            <div className="output-specs-list">
              <div className="spec-row">
                <span>Monthly Cost Drain:</span>
                <strong>${monthlyCost.toFixed(2)}</strong>
              </div>
              <div className="spec-row">
                <span>Annual Cost Drain:</span>
                <strong style={{ color: annualCostPctOfBalance > 5 ? "#ff8787" : "#c9ed85" }}>
                  ${annualCost.toFixed(2)} ({annualCostPctOfBalance.toFixed(2)}%)
                </strong>
              </div>
              <div className="spec-row">
                <span>Cost as % of Risk Budget (1%):</span>
                <strong style={{ color: costAsPctOfRisk > 20 ? "#ff8787" : "#ffd43b" }}>
                  {costAsPctOfRisk.toFixed(1)}%
                </strong>
              </div>
              <div className="spec-row">
                <span>Trades to Lose 10% (cost-only):</span>
                <strong>{Math.floor((numBalance * 0.1) / costPerTrade)} trades</strong>
              </div>
            </div>

            <div className="insight-card">
              <Info size={16} />
              <p>
                {costAsPctOfRisk > 20
                  ? `⚠️ CRITICAL: Transaction costs eat ${costAsPctOfRisk.toFixed(0)}% of every trade's risk budget. A strategy that returns +1R is actually net negative after costs. Reduce trade frequency, use limit orders, or trade cheaper pairs.`
                  : `Healthy cost structure. Costs consume ${costAsPctOfRisk.toFixed(1)}% of your 1% risk budget — most directional strategies can absorb this friction.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: Correlation Risk & Diversification */}
      {activeTab === "correlation_risk" && (
        <div className="risk-grid-layout">
          <div className="risk-card input-card">
            <h3>Correlation Risk & Diversification</h3>
            <p className="card-desc">
              A portfolio of correlated positions is a single disguised bet. Visualise how your open positions amplify — or hedge — each other.
            </p>

            <div className="portfolio-editor">
              {portfolioPositions.map((pos, idx) => (
                <div key={idx} className="portfolio-row">
                  <select
                    value={pos.symbol}
                    onChange={e => {
                      const next = [...portfolioPositions];
                      next[idx] = { ...pos, symbol: e.target.value };
                      setPortfolioPositions(next);
                    }}
                  >
                    <option value="EUR/USD">EUR/USD</option>
                    <option value="GBP/USD">GBP/USD</option>
                    <option value="USD/JPY">USD/JPY</option>
                    <option value="AUD/USD">AUD/USD</option>
                    <option value="XAU/USD">XAU/USD</option>
                  </select>
                  <select
                    value={pos.direction}
                    onChange={e => {
                      const next = [...portfolioPositions];
                      next[idx] = { ...pos, direction: e.target.value as "BUY" | "SELL" };
                      setPortfolioPositions(next);
                    }}
                  >
                    <option value="BUY">BUY (Long)</option>
                    <option value="SELL">SELL (Short)</option>
                  </select>
                  <input
                    type="number"
                    min="0.01"
                    step="0.1"
                    value={pos.lots}
                    onChange={e => {
                      const next = [...portfolioPositions];
                      next[idx] = { ...pos, lots: Math.max(0.01, Number(e.target.value) || 0.01) };
                      setPortfolioPositions(next);
                    }}
                  />
                  <button
                    className="remove-position-btn"
                    onClick={() => setPortfolioPositions(portfolioPositions.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="add-position-btn"
                onClick={() => setPortfolioPositions([...portfolioPositions, { symbol: "EUR/USD", lots: 0.5, direction: "BUY" }])}
              >
                + Add Position
              </button>
            </div>

            <div className="formula-callout">
              <strong>Effective Portfolio Risk = √(Σᵢ Σⱼ rᵢ·rⱼ·ρᵢⱼ·sign(direction))</strong>
              <code>Diversification Benefit = Naïve Sum − Effective Risk</code>
            </div>
          </div>

          <div className="risk-card output-card">
            <h3>Portfolio Risk Audit</h3>
            <div className="primary-output-box">
              <span>EFFECTIVE RISK</span>
              <strong style={{ color: effectiveRisk > 3 ? "#ff8787" : effectiveRisk > 1.5 ? "#ffd43b" : "#c9ed85" }}>
                {effectiveRisk.toFixed(2)}%
              </strong>
              <p>Naïve sum: {naiveRiskSum.toFixed(2)}% | Amplification: ×{riskAmplification.toFixed(2)}</p>
            </div>

            <div className="output-specs-list">
              <div className="spec-row">
                <span>Naïve Risk Sum:</span>
                <strong>{naiveRiskSum.toFixed(2)}%</strong>
              </div>
              <div className="spec-row">
                <span>Effective Portfolio Risk:</span>
                <strong style={{ color: effectiveRisk > naiveRiskSum ? "#ff8787" : "#c9ed85" }}>
                  {effectiveRisk.toFixed(2)}%
                </strong>
              </div>
              <div className="spec-row">
                <span>Diversification Benefit:</span>
                <strong style={{ color: diversificationBenefit > 0 ? "#c9ed85" : "#ff8787" }}>
                  {diversificationBenefit > 0 ? `−${diversificationBenefit.toFixed(2)}%` : `+${Math.abs(diversificationBenefit).toFixed(2)}% amplification`}
                </strong>
              </div>
              <div className="spec-row">
                <span>Open Positions:</span>
                <strong>{portfolioPositions.length}</strong>
              </div>
            </div>

            {isOverconcentrated ? (
              <div className="safety-badge" style={{ background: "#5a3a10", color: "#ffe0b0" }}>
                <AlertTriangle size={16} />
                <span>
                  <strong>OVER-CONCENTRATED.</strong> Your positions are highly correlated in the same direction. A single macro shock (e.g. USD strength) will hit them all simultaneously — you are not diversified, you are leveraged.
                </span>
              </div>
            ) : (
              <div className="safety-badge">
                <Network size={16} />
                <span>
                  Reasonable diversification. Correlations are partially offsetting, so total portfolio risk is lower than the naïve sum of individual risks.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
