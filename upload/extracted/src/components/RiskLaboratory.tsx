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
  Flame
} from "lucide-react";

export default function RiskLaboratory() {
  const [activeTab, setActiveTab] = useState<"position_sizing" | "ruin_simulator" | "rr_matrix" | "drawdown_curve">("position_sizing");

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
    </div>
  );
}
