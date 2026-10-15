"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Play,
  RotateCcw,
  TrendingDown,
  Info,
  Flame,
  Zap,
  Target,
} from "lucide-react";

type SimRun = {
  finalEquity: number;
  maxDrawdownPct: number;
  wentBust: boolean;
  equityCurve: number[];
};

export default function MonteCarloEquity() {
  const [startingBalance, setStartingBalance] = useState("10000");
  const [winRate, setWinRate] = useState("55");
  const [rewardToRisk, setRewardToRisk] = useState("1.5");
  const [riskPerTradePct, setRiskPerTradePct] = useState("2.0");
  const [tradeCount, setTradeCount] = useState("100");
  const [simulations, setSimulations] = useState("50");
  const [hasRun, setHasRun] = useState(false);
  const [seed, setSeed] = useState(0); // forces useMemo recompute on "Run"

  const numBalance = Math.max(100, Number(startingBalance) || 10000);
  const numWinRate = Math.max(0.05, Math.min(0.95, (Number(winRate) || 55) / 100));
  const numRr = Math.max(0.1, Number(rewardToRisk) || 1.5);
  const numRiskPct = Math.max(0.1, Math.min(20, Number(riskPerTradePct) || 2));
  const numTrades = Math.max(10, Math.min(500, Number(tradeCount) || 100));
  const numSims = Math.max(5, Math.min(200, Number(simulations) || 50));

  // Theoretical expectancy
  const expectancyR = numWinRate * numRr - (1 - numWinRate) * 1;

  const runs: SimRun[] = useMemo(() => {
    if (!hasRun) return [];
    // simple LCG for reproducibility within a single render
    let s = seed * 1234567 + 1;
    const rng = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };

    const out: SimRun[] = [];
    for (let sim = 0; sim < numSims; sim++) {
      let equity = numBalance;
      let peak = numBalance;
      let maxDd = 0;
      let wentBust = false;
      const curve = [equity];
      for (let t = 0; t < numTrades; t++) {
        const r = rng();
        const riskAmount = (equity * numRiskPct) / 100;
        const win = r < numWinRate;
        const pnl = win ? riskAmount * numRr : -riskAmount;
        equity = Math.max(0, equity + pnl);
        if (equity <= 0) {
          wentBust = true;
          curve.push(0);
          break;
        }
        peak = Math.max(peak, equity);
        const dd = peak > 0 ? ((equity - peak) / peak) * 100 : 0;
        if (dd < maxDd) maxDd = dd;
        curve.push(Math.round(equity * 100) / 100);
      }
      out.push({
        finalEquity: Math.round(equity * 100) / 100,
        maxDrawdownPct: Math.round(maxDd * 10) / 10,
        wentBust,
        equityCurve: curve,
      });
    }
    return out;
  }, [hasRun, seed, numBalance, numWinRate, numRr, numRiskPct, numTrades, numSims]);

  const bustCount = runs.filter(r => r.wentBust).length;
  const bustProb = runs.length > 0 ? (bustCount / runs.length) * 100 : 0;
  const medianFinal = runs.length > 0
    ? runs.map(r => r.finalEquity).sort((a, b) => a - b)[Math.floor(runs.length / 2)]
    : numBalance;
  const avgMaxDd = runs.length > 0
    ? runs.reduce((s, r) => s + r.maxDrawdownPct, 0) / runs.length
    : 0;
  const worstMaxDd = runs.length > 0 ? Math.min(...runs.map(r => r.maxDrawdownPct)) : 0;
  const profitProb = runs.length > 0
    ? (runs.filter(r => r.finalEquity > numBalance).length / runs.length) * 100
    : 0;

  // Chart bounds
  const allEquities = runs.flatMap(r => r.equityCurve).concat([numBalance]);
  const maxEq = Math.max(...allEquities, numBalance);
  const minEq = Math.min(...allEquities, 0);
  const range = Math.max(1, maxEq - minEq);

  return (
    <div className="risk-lab-container">
      <div className="risk-lab-header">
        <div className="header-left">
          <div className="kicker-badge">
            <Activity size={15} /> MONTE CARLO EQUITY SIMULATOR
          </div>
          <h2>Random Equity Paths &amp; Risk of Ruin</h2>
          <p>
            A single backtested equity curve is one sample from a probability distribution.
            Run {numSims} parallel simulations of your strategy&apos;s win-rate and R:R profile to see the
            <strong> full distribution of outcomes</strong>, including the probability of total account ruin.
          </p>
        </div>
      </div>

      <div className="risk-grid-layout">
        <div className="risk-card input-card">
          <h3>Strategy Profile</h3>
          <p className="card-desc">Describe your strategy&apos;s statistical signature. Each parameter feeds the simulation engine.</p>

          <div className="risk-fields-grid">
            <label>
              <span>Starting Balance ($)</span>
              <input type="number" min="100" step="500" value={startingBalance} onChange={e => setStartingBalance(e.target.value)} />
            </label>
            <label>
              <span>Win Rate (%)</span>
              <input type="number" min="5" max="95" step="5" value={winRate} onChange={e => setWinRate(e.target.value)} />
            </label>
            <label>
              <span>Reward-to-Risk (1 : X)</span>
              <input type="number" min="0.1" max="10" step="0.1" value={rewardToRisk} onChange={e => setRewardToRisk(e.target.value)} />
            </label>
            <label>
              <span>Risk Per Trade (%)</span>
              <input type="number" min="0.1" max="20" step="0.1" value={riskPerTradePct} onChange={e => setRiskPerTradePct(e.target.value)} />
            </label>
            <label>
              <span>Trades Per Simulation</span>
              <input type="number" min="10" max="500" step="10" value={tradeCount} onChange={e => setTradeCount(e.target.value)} />
            </label>
            <label>
              <span>Number of Simulations</span>
              <input type="number" min="5" max="200" step="5" value={simulations} onChange={e => setSimulations(e.target.value)} />
            </label>
          </div>

          <div className="formula-callout">
            <strong>Per-trade Expectancy = (Win% × R) − (Loss% × 1)</strong>
            <code>Your expectancy: {expectancyR >= 0 ? "+" : ""}{expectancyR.toFixed(3)}R per trade</code>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="run-backtest-btn" onClick={() => { setHasRun(true); setSeed(s => s + 1); }}>
              <Play size={16} /> Run {numSims} Monte Carlo Paths
            </button>
            {hasRun && (
              <button className="reset-mc-btn" onClick={() => { setHasRun(false); setSeed(0); }}>
                <RotateCcw size={16} /> Reset
              </button>
            )}
          </div>
        </div>

        <div className="risk-card output-card">
          <h3>Simulation Outcomes</h3>
          {!hasRun ? (
            <div className="backtest-empty">
              <Info size={20} />
              <p>Configure your strategy profile on the left and run {numSims} parallel simulations to see the distribution of possible outcomes.</p>
            </div>
          ) : (
            <>
              <div className="primary-output-box">
                <span>RISK OF RUIN</span>
                <strong style={{ color: bustProb > 20 ? "#ff8787" : bustProb > 5 ? "#ffd43b" : "#c9ed85" }}>
                  {bustProb.toFixed(1)}%
                </strong>
                <p>{bustCount} of {runs.length} paths went to zero</p>
              </div>

              <div className="output-specs-list">
                <div className="spec-row">
                  <span>Probability of Profit:</span>
                  <strong style={{ color: profitProb >= 50 ? "#c9ed85" : "#ff8787" }}>
                    {profitProb.toFixed(1)}%
                  </strong>
                </div>
                <div className="spec-row">
                  <span>Median Final Equity:</span>
                  <strong style={{ color: medianFinal >= numBalance ? "#c9ed85" : "#ff8787" }}>
                    ${medianFinal.toLocaleString()}
                  </strong>
                </div>
                <div className="spec-row">
                  <span>Average Max Drawdown:</span>
                  <strong style={{ color: avgMaxDd < -15 ? "#ff8787" : "#ffd43b" }}>
                    {avgMaxDd.toFixed(1)}%
                  </strong>
                </div>
                <div className="spec-row">
                  <span>Worst Path Drawdown:</span>
                  <strong style={{ color: "#ff8787" }}>{worstMaxDd.toFixed(1)}%</strong>
                </div>
              </div>

              <div className="insight-card">
                {bustProb > 20 ? (
                  <>
                    <AlertTriangle size={16} />
                    <p>
                      <strong>UNACCEPTABLE RISK OF RUIN.</strong> A {bustProb.toFixed(0)}% chance of blowing the account is not a trading plan — it is slow-motion gambling. Drop risk-per-trade to 1% or lower and re-run.
                    </p>
                  </>
                ) : bustProb > 5 ? (
                  <>
                    <Flame size={16} />
                    <p>
                      Elevated ruin probability ({bustProb.toFixed(1)}%). Even with positive expectancy, variance will eventually hit your account. Consider reducing risk-per-trade or adding a daily drawdown circuit-breaker.
                    </p>
                  </>
                ) : expectancyR <= 0 ? (
                  <>
                    <AlertTriangle size={16} />
                    <p>
                      Negative expectancy ({expectancyR.toFixed(2)}R). You may have survived these simulations through luck alone, but the longer you play, the more surely the math grinds the account to zero.
                    </p>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <p>
                      Sustainable risk profile. With {numRiskPct}% per trade and positive expectancy of {expectancyR.toFixed(2)}R, the math is on your side. The dispersion of paths shows why discipline through losing streaks is non-negotiable.
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Equity Path Fan Chart */}
      {hasRun && runs.length > 0 && (
        <div className="risk-card" style={{ background: "white" }}>
          <h3 style={{ marginBottom: 12 }}>Simulated Equity Path Fan ({runs.length} paths)</h3>
          <div className="equity-curve-chart">
            <svg width="100%" height="280" viewBox="0 0 800 280" preserveAspectRatio="none">
              {/* Starting balance baseline */}
              <line
                x1="0"
                y1={280 - ((numBalance - minEq) / range) * 260 - 10}
                x2="800"
                y2={280 - ((numBalance - minEq) / range) * 260 - 10}
                stroke="#dde6db"
                strokeDasharray="4,4"
                strokeWidth="1"
              />
              {/* Zero baseline if visible */}
              {minEq <= 0 && (
                <line x1="0" y1="270" x2="800" y2="270" stroke="#fa5252" strokeWidth="1" strokeDasharray="2,2" />
              )}
              {/* Plot each path with low opacity */}
              {runs.map((run, simIdx) => (
                <polyline
                  key={simIdx}
                  points={run.equityCurve.map((eq, idx) => {
                    const x = (idx / Math.max(1, numTrades)) * 800;
                    const y = 280 - ((eq - minEq) / range) * 260 - 10;
                    return `${x},${Math.max(0, Math.min(280, y))}`;
                  }).join(" ")}
                  fill="none"
                  stroke={run.wentBust ? "#f03e3e" : run.finalEquity >= numBalance ? "#37b24d" : "#fab005"}
                  strokeWidth="1"
                  strokeOpacity="0.35"
                />
              ))}
            </svg>
          </div>
          <div className="equity-legend">
            <span><span className="legend-swatch" style={{ background: "#37b24d" }}></span> Profitable Path</span>
            <span><span className="legend-swatch" style={{ background: "#fab005" }}></span> Losing Path</span>
            <span><span className="legend-swatch" style={{ background: "#f03e3e" }}></span> Account Blown (Ruin)</span>
            <span><span className="legend-swatch" style={{ background: "#dde6db" }}></span> Starting Balance</span>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      {hasRun && runs.length > 0 && (
        <div className="mc-stats-grid">
          <div className="mc-stat-tile">
            <Target size={18} />
            <span>Theoretical Expectancy</span>
            <strong style={{ color: expectancyR >= 0 ? "#37b24d" : "#f03e3e" }}>
              {expectancyR >= 0 ? "+" : ""}{expectancyR.toFixed(3)}R
            </strong>
            <p>Per-trade mathematical edge based on win-rate × R:R</p>
          </div>
          <div className="mc-stat-tile">
            <Zap size={18} />
            <span>Empirical Profit Rate</span>
            <strong style={{ color: profitProb >= 50 ? "#37b24d" : "#f03e3e" }}>
              {profitProb.toFixed(1)}%
            </strong>
            <p>Share of paths that ended above starting balance</p>
          </div>
          <div className="mc-stat-tile">
            <TrendingDown size={18} />
            <span>Average Max Drawdown</span>
            <strong style={{ color: avgMaxDd < -15 ? "#f03e3e" : "#fab005" }}>
              {avgMaxDd.toFixed(1)}%
            </strong>
            <p>Mean peak-to-trough decline across all simulated paths</p>
          </div>
          <div className="mc-stat-tile" style={{ background: bustProb > 5 ? "#5a1a1a" : "#163832" }}>
            <AlertTriangle size={18} />
            <span>Risk of Ruin</span>
            <strong style={{ color: bustProb > 20 ? "#ff8787" : bustProb > 5 ? "#ffd43b" : "#69db7c" }}>
              {bustProb.toFixed(1)}%
            </strong>
            <p>Probability that a path hits zero before completion</p>
          </div>
        </div>
      )}
    </div>
  );
}
