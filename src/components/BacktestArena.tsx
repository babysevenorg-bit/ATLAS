"use client";

import React, { useState, useMemo } from "react";
import {
  Play,
  Rewind,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  AlertTriangle,
  ShieldCheck,
  Info,
  Cpu,
  BarChart3,
  Gauge,
  Zap,
} from "lucide-react";
import { REPLAY_INSTRUMENTS, type Candle } from "@/lib/marketData";

type StrategyId = "sma_crossover" | "rsi_oversold" | "breakout" | "mean_reversion";

type Trade = {
  entryIndex: number;
  exitIndex: number;
  direction: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number;
  pnlPips: number;
  pnlUsd: number;
  rationale: string;
  outcome: "WIN" | "LOSS";
};

type BacktestResult = {
  trades: Trade[];
  wins: number;
  losses: number;
  winRate: number;
  totalPnlUsd: number;
  maxDrawdownUsd: number;
  maxDrawdownPct: number;
  expectancyR: number;
  profitFactor: number;
  longestWinStreak: number;
  longestLossStreak: number;
  equityCurve: { index: number; equity: number; drawdown: number }[];
};

const STRATEGIES: { id: StrategyId; name: string; description: string; icon: typeof Activity }[] = [
  {
    id: "sma_crossover",
    name: "SMA Crossover (20/50)",
    description: "Buy when fast SMA crosses above slow SMA; sell on opposite cross. Classic trend-following baseline.",
    icon: TrendingUp,
  },
  {
    id: "rsi_oversold",
    name: "RSI Oversold Reversal (14)",
    description: "Buy when RSI(14) crosses below 30 then recovers above 35; exit when RSI > 50. Mean-reversion logic.",
    icon: Activity,
  },
  {
    id: "breakout",
    name: "Donchian Breakout (20)",
    description: "Buy on break above 20-bar high; exit on break below 10-bar low. Turtle-style breakout.",
    icon: Target,
  },
  {
    id: "mean_reversion",
    name: "Bollinger Reversion (20, 2σ)",
    description: "Buy when price closes below lower band; exit when price returns to middle band. Fades extremes.",
    icon: BarChart3,
  },
];

function sma(values: number[], period: number, idx: number): number {
  if (idx + 1 < period) return NaN;
  let sum = 0;
  for (let i = idx - period + 1; i <= idx; i++) sum += values[i];
  return sum / period;
}

function rsi(closes: number[], period: number, idx: number): number {
  if (idx < period) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = idx - period + 1; i <= idx; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function donchianHigh(candles: Candle[], period: number, idx: number): number {
  let max = -Infinity;
  for (let i = Math.max(0, idx - period + 1); i <= idx; i++) {
    if (candles[i].high > max) max = candles[i].high;
  }
  return max;
}

function donchianLow(candles: Candle[], period: number, idx: number): number {
  let min = Infinity;
  for (let i = Math.max(0, idx - period + 1); i <= idx; i++) {
    if (candles[i].low < min) min = candles[i].low;
  }
  return min;
}

function runBacktest(
  candles: Candle[],
  strategy: StrategyId,
  startingBalance: number,
  riskPerTradePct: number,
  spreadPips: number
): BacktestResult {
  const closes = candles.map(c => c.close);
  const isJpy = candles[0].close > 50; // heuristic
  const pipSize = isJpy ? 0.01 : 0.0001;
  const pipValueUsdPerLot = isJpy ? 1000 / closes[0] : 10;
  const lotsPerTrade = 0.5; // fixed lot for simplicity

  const trades: Trade[] = [];
  let equity = startingBalance;
  let peakEquity = startingBalance;
  const equityCurve: { index: number; equity: number; drawdown: number }[] = [
    { index: 0, equity: startingBalance, drawdown: 0 },
  ];
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;

  let position: {
    direction: "BUY" | "SELL";
    entryIndex: number;
    entryPrice: number;
    rationale: string;
  } | null = null;

  const warmup = 50;

  for (let i = warmup; i < candles.length; i++) {
    const prev = i - 1;
    const fastSma = sma(closes, 20, prev);
    const slowSma = sma(closes, 50, prev);
    const fastSmaPrev = sma(closes, 20, prev - 1);
    const slowSmaPrev = sma(closes, 50, prev - 1);
    const rsiVal = rsi(closes, 14, prev);
    const rsiPrev = rsi(closes, 14, prev - 1);
    const donchHigh = donchianHigh(candles, 20, prev);
    const donchLow = donchianLow(candles, 10, prev);
    const midBand = sma(closes, 20, prev);
    const stdDev = (() => {
      if (prev + 1 < 20) return 0;
      let sum = 0;
      for (let k = prev - 19; k <= prev; k++) sum += Math.pow(closes[k] - midBand, 2);
      return Math.sqrt(sum / 20);
    })();
    const lowerBand = midBand - 2 * stdDev;

    // EXIT LOGIC
    if (position) {
      let shouldExit = false;
      let exitPrice = candles[i].close;
      let rationale = "";

      if (strategy === "sma_crossover") {
        if (position.direction === "BUY" && fastSma < slowSma) {
          shouldExit = true;
          rationale = "Fast SMA crossed below slow SMA";
        } else if (position.direction === "SELL" && fastSma > slowSma) {
          shouldExit = true;
          rationale = "Fast SMA crossed above slow SMA";
        }
      } else if (strategy === "rsi_oversold") {
        if (rsiVal > 50) {
          shouldExit = true;
          rationale = `RSI reached ${rsiVal.toFixed(0)} > 50`;
        }
      } else if (strategy === "breakout") {
        if (position.direction === "BUY" && candles[i].close < donchLow) {
          shouldExit = true;
          rationale = "Price broke below 10-bar low";
        }
      } else if (strategy === "mean_reversion") {
        if (candles[i].close >= midBand) {
          shouldExit = true;
          rationale = "Price reverted to middle band";
        }
      }

      if (shouldExit) {
        const priceDiff =
          position.direction === "BUY"
            ? exitPrice - position.entryPrice
            : position.entryPrice - exitPrice;
        const pnlPips = priceDiff / pipSize - spreadPips;
        const pnlUsd = pnlPips * pipValueUsdPerLot * lotsPerTrade;
        equity += pnlUsd;
        trades.push({
          entryIndex: position.entryIndex,
          exitIndex: i,
          direction: position.direction,
          entryPrice: position.entryPrice,
          exitPrice,
          pnlPips: Math.round(pnlPips * 10) / 10,
          pnlUsd: Math.round(pnlUsd * 100) / 100,
          rationale: position.rationale,
          outcome: pnlUsd >= 0 ? "WIN" : "LOSS",
        });
        position = null;
      }
    }

    // ENTRY LOGIC
    if (!position) {
      let entry: { direction: "BUY" | "SELL"; rationale: string } | null = null;

      if (strategy === "sma_crossover") {
        if (fastSmaPrev <= slowSmaPrev && fastSma > slowSma) {
          entry = { direction: "BUY", rationale: "Bullish SMA crossover" };
        } else if (fastSmaPrev >= slowSmaPrev && fastSma < slowSma) {
          entry = { direction: "SELL", rationale: "Bearish SMA crossover" };
        }
      } else if (strategy === "rsi_oversold") {
        if (rsiPrev < 30 && rsiVal > 35) {
          entry = { direction: "BUY", rationale: `RSI oversold bounce (${rsiVal.toFixed(0)})` };
        }
      } else if (strategy === "breakout") {
        if (candles[i].close > donchHigh && candles[i - 1].close <= donchHigh) {
          entry = { direction: "BUY", rationale: `Breakout above 20-bar high (${donchHigh.toFixed(5)})` };
        }
      } else if (strategy === "mean_reversion") {
        if (candles[prev].close < lowerBand) {
          entry = { direction: "BUY", rationale: `Close below lower Bollinger band (${lowerBand.toFixed(5)})` };
        }
      }

      if (entry) {
        position = {
          direction: entry.direction,
          entryIndex: i,
          entryPrice: candles[i].close,
          rationale: entry.rationale,
        };
      }
    }

    // Update equity curve & drawdown
    peakEquity = Math.max(peakEquity, equity);
    const drawdown = equity - peakEquity;
    if (drawdown < maxDrawdownUsd) maxDrawdownUsd = drawdown;
    const ddPct = peakEquity > 0 ? (drawdown / peakEquity) * 100 : 0;
    if (ddPct < maxDrawdownPct) maxDrawdownPct = ddPct;
    equityCurve.push({ index: i, equity: Math.round(equity * 100) / 100, drawdown: Math.round(ddPct * 10) / 10 });
  }

  // Close any open position at last candle for fair backtest
  if (position) {
    const exitPrice = candles[candles.length - 1].close;
    const priceDiff =
      position.direction === "BUY"
        ? exitPrice - position.entryPrice
        : position.entryPrice - exitPrice;
    const pnlPips = priceDiff / pipSize - spreadPips;
    const pnlUsd = pnlPips * pipValueUsdPerLot * lotsPerTrade;
    equity += pnlUsd;
    trades.push({
      entryIndex: position.entryIndex,
      exitIndex: candles.length - 1,
      direction: position.direction,
      entryPrice: position.entryPrice,
      exitPrice,
      pnlPips: Math.round(pnlPips * 10) / 10,
      pnlUsd: Math.round(pnlUsd * 100) / 100,
      rationale: position.rationale + " (force-closed at backtest end)",
      outcome: pnlUsd >= 0 ? "WIN" : "LOSS",
    });
    peakEquity = Math.max(peakEquity, equity);
    const ddPct = peakEquity > 0 ? ((equity - peakEquity) / peakEquity) * 100 : 0;
    if (ddPct < maxDrawdownPct) maxDrawdownPct = ddPct;
    equityCurve.push({
      index: candles.length - 1,
      equity: Math.round(equity * 100) / 100,
      drawdown: Math.round(ddPct * 10) / 10,
    });
  }

  const wins = trades.filter(t => t.outcome === "WIN").length;
  const losses = trades.filter(t => t.outcome === "LOSS").length;
  const grossProfit = trades.filter(t => t.pnlUsd > 0).reduce((s, t) => s + t.pnlUsd, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnlUsd < 0).reduce((s, t) => s + t.pnlUsd, 0));
  const riskPerTrade = (startingBalance * riskPerTradePct) / 100;
  const expectancyR =
    trades.length > 0
      ? trades.reduce((s, t) => s + (t.pnlUsd > 0 ? t.pnlUsd / riskPerTrade : -1), 0) / trades.length
      : 0;

  // Streaks
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let curWin = 0;
  let curLoss = 0;
  for (const t of trades) {
    if (t.outcome === "WIN") {
      curWin++;
      curLoss = 0;
      longestWinStreak = Math.max(longestWinStreak, curWin);
    } else {
      curLoss++;
      curWin = 0;
      longestLossStreak = Math.max(longestLossStreak, curLoss);
    }
  }

  return {
    trades,
    wins,
    losses,
    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
    totalPnlUsd: Math.round((equity - startingBalance) * 100) / 100,
    maxDrawdownUsd: Math.round(maxDrawdownUsd * 100) / 100,
    maxDrawdownPct: Math.round(maxDrawdownPct * 10) / 10,
    expectancyR: Math.round(expectancyR * 100) / 100,
    profitFactor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? 99 : 0,
    longestWinStreak,
    longestLossStreak,
    equityCurve,
  };
}

export default function BacktestArena() {
  const [strategyId, setStrategyId] = useState<StrategyId>("sma_crossover");
  const [instrumentSymbol, setInstrumentSymbol] = useState("EUR/USD");
  const [startingBalance, setStartingBalance] = useState("10000");
  const [riskPerTrade, setRiskPerTrade] = useState("1.0");
  const [spreadPips, setSpreadPips] = useState("1.5");
  const [hasRun, setHasRun] = useState(false);

  const instrument = REPLAY_INSTRUMENTS.find(i => i.symbol === instrumentSymbol) || REPLAY_INSTRUMENTS[0];
  const candles = instrument.candles;
  const numBalance = Math.max(100, Number(startingBalance) || 10000);
  const numRisk = Math.max(0.1, Math.min(10, Number(riskPerTrade) || 1));
  const numSpread = Math.max(0, Number(spreadPips) || 0);

  const result = useMemo<BacktestResult>(() => {
    if (!hasRun) {
      return {
        trades: [],
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnlUsd: 0,
        maxDrawdownUsd: 0,
        maxDrawdownPct: 0,
        expectancyR: 0,
        profitFactor: 0,
        longestWinStreak: 0,
        longestLossStreak: 0,
        equityCurve: [],
      };
    }
    return runBacktest(candles, strategyId, numBalance, numRisk, numSpread);
  }, [hasRun, candles, strategyId, numBalance, numRisk, numSpread]);

  const equityMax = result.equityCurve.length > 0 ? Math.max(...result.equityCurve.map(p => p.equity)) : numBalance;
  const equityMin = result.equityCurve.length > 0 ? Math.min(...result.equityCurve.map(p => p.equity)) : numBalance;
  const equityRange = Math.max(1, equityMax - equityMin);

  return (
    <div className="risk-lab-container">
      <div className="risk-lab-header">
        <div className="header-left">
          <div className="kicker-badge">
            <Cpu size={15} /> STRATEGY BACKTEST ARENA
          </div>
          <h2>Test Rules Against Historical Replay Data</h2>
          <p>
            Run four classic mechanical strategies on the platform&apos;s licensed-equivalent historical candle data.
            Every backtest includes spread cost, force-closes open positions at the end, and reports full equity-curve statistics.
            <strong> Educational simulations only — historical performance never guarantees future results.</strong>
          </p>
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="backtest-strategy-grid">
        {STRATEGIES.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              className={`strategy-card ${strategyId === s.id ? "active" : ""}`}
              onClick={() => setStrategyId(s.id)}
            >
              <div className="strategy-icon-row">
                <Icon size={18} />
                <strong>{s.name}</strong>
              </div>
              <p>{s.description}</p>
            </button>
          );
        })}
      </div>

      {/* Configuration + Run */}
      <div className="risk-grid-layout">
        <div className="risk-card input-card">
          <h3>1. Configure Backtest</h3>
          <p className="card-desc">Adjust parameters before running the strategy against {candles.length} historical candles of {instrumentSymbol}.</p>

          <div className="risk-fields-grid">
            <label>
              <span>Instrument</span>
              <select value={instrumentSymbol} onChange={e => setInstrumentSymbol(e.target.value)}>
                {REPLAY_INSTRUMENTS.map(i => (
                  <option key={i.symbol} value={i.symbol}>
                    {i.symbol} — {i.category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Starting Balance ($)</span>
              <input type="number" min="100" step="500" value={startingBalance} onChange={e => setStartingBalance(e.target.value)} />
            </label>
            <label>
              <span>Risk Per Trade (%)</span>
              <input type="number" min="0.1" max="10" step="0.1" value={riskPerTrade} onChange={e => setRiskPerTrade(e.target.value)} />
            </label>
            <label>
              <span>Spread Cost (Pips)</span>
              <input type="number" min="0" step="0.1" value={spreadPips} onChange={e => setSpreadPips(e.target.value)} />
            </label>
          </div>

          <button
            className="run-backtest-btn"
            onClick={() => setHasRun(true)}
          >
            <Play size={16} /> Run Backtest on {candles.length} Candles
          </button>
        </div>

        <div className="risk-card output-card">
          <h3>2. Backtest Result Snapshot</h3>
          {!hasRun ? (
            <div className="backtest-empty">
              <Info size={20} />
              <p>Configure parameters and run the backtest to see performance metrics, equity curve, and trade-by-trade audit.</p>
            </div>
          ) : (
            <>
              <div className="primary-output-box">
                <span>NET P&amp;L</span>
                <strong style={{ color: result.totalPnlUsd >= 0 ? "#69db7c" : "#ff8787" }}>
                  {result.totalPnlUsd >= 0 ? "+" : ""}${result.totalPnlUsd.toLocaleString()}
                </strong>
                <p>{((result.totalPnlUsd / numBalance) * 100).toFixed(2)}% return on ${numBalance.toLocaleString()} start balance</p>
              </div>

              <div className="output-specs-list">
                <div className="spec-row">
                  <span>Total Trades:</span>
                  <strong>{result.trades.length}</strong>
                </div>
                <div className="spec-row">
                  <span>Win Rate:</span>
                  <strong style={{ color: result.winRate >= 50 ? "#69db7c" : "#ff8787" }}>
                    {result.winRate.toFixed(1)}% ({result.wins}W / {result.losses}L)
                  </strong>
                </div>
                <div className="spec-row">
                  <span>Max Drawdown:</span>
                  <strong style={{ color: result.maxDrawdownPct < -10 ? "#ff8787" : "#ffd43b" }}>
                    -${Math.abs(result.maxDrawdownUsd).toLocaleString()} ({result.maxDrawdownPct.toFixed(1)}%)
                  </strong>
                </div>
                <div className="spec-row">
                  <span>Expectancy (R):</span>
                  <strong style={{ color: result.expectancyR >= 0 ? "#69db7c" : "#ff8787" }}>
                    {result.expectancyR >= 0 ? "+" : ""}{result.expectancyR.toFixed(2)}R per trade
                  </strong>
                </div>
                <div className="spec-row">
                  <span>Profit Factor:</span>
                  <strong style={{ color: result.profitFactor >= 1.5 ? "#69db7c" : result.profitFactor >= 1 ? "#ffd43b" : "#ff8787" }}>
                    {result.profitFactor.toFixed(2)}
                  </strong>
                </div>
                <div className="spec-row">
                  <span>Longest Win Streak:</span>
                  <strong>{result.longestWinStreak} trades</strong>
                </div>
                <div className="spec-row">
                  <span>Longest Loss Streak:</span>
                  <strong style={{ color: result.longestLossStreak >= 5 ? "#ff8787" : "white" }}>
                    {result.longestLossStreak} trades
                  </strong>
                </div>
              </div>

              <div className="insight-card">
                {result.expectancyR > 0 ? (
                  <>
                    <ShieldCheck size={16} />
                    <p>
                      Positive expectancy of {result.expectancyR.toFixed(2)}R per trade on this dataset. <strong>WARNING:</strong> Curve-fitting is the #1 trap in backtesting. A strategy that works on 60 candles of EUR/USD may fail entirely on GBP/USD or in live conditions. Always forward-test on out-of-sample data.
                    </p>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    <p>
                      Negative expectancy of {result.expectancyR.toFixed(2)}R per trade. This mechanical rule loses money on this dataset after spread costs. Mechanical strategies without contextual filters rarely survive real markets.
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Equity Curve Visualization */}
      {hasRun && result.equityCurve.length > 0 && (
        <div className="risk-card" style={{ background: "white" }}>
          <h3 style={{ marginBottom: 12 }}>Equity Curve &amp; Drawdown Profile</h3>
          <div className="equity-curve-chart">
            <svg width="100%" height="200" viewBox="0 0 800 200" preserveAspectRatio="none">
              {/* Baseline (starting balance) */}
              <line x1="0" y1={200 - ((numBalance - equityMin) / equityRange) * 180 - 10} x2="800" y2={200 - ((numBalance - equityMin) / equityRange) * 180 - 10} stroke="#dde6db" strokeDasharray="4,4" strokeWidth="1" />
              {/* Equity curve */}
              <polyline
                points={result.equityCurve.map((p, idx) => {
                  const x = (idx / Math.max(1, result.equityCurve.length - 1)) * 800;
                  const y = 200 - ((p.equity - equityMin) / equityRange) * 180 - 10;
                  return `${x},${y}`;
                }).join(" ")}
                fill="none"
                stroke={result.totalPnlUsd >= 0 ? "#37b24d" : "#f03e3e"}
                strokeWidth="2"
              />
              {/* Drawdown area */}
              <polyline
                points={result.equityCurve.map((p, idx) => {
                  const x = (idx / Math.max(1, result.equityCurve.length - 1)) * 800;
                  const baseline = 200 - ((numBalance - equityMin) / equityRange) * 180 - 10;
                  const y = baseline + (p.drawdown / 100) * 100;
                  return `${x},${Math.min(200, Math.max(0, y))}`;
                }).join(" ")}
                fill="none"
                stroke="#ff922b"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
            </svg>
          </div>
          <div className="equity-legend">
            <span><span className="legend-swatch" style={{ background: result.totalPnlUsd >= 0 ? "#37b24d" : "#f03e3e" }}></span> Equity Curve</span>
            <span><span className="legend-swatch" style={{ background: "#ff922b" }}></span> Drawdown (%)</span>
            <span><span className="legend-swatch" style={{ background: "#dde6db" }}></span> Starting Balance (${numBalance.toLocaleString()})</span>
          </div>
        </div>
      )}

      {/* Trade-by-Trade Audit */}
      {hasRun && result.trades.length > 0 && (
        <div className="risk-card" style={{ background: "white" }}>
          <h3 style={{ marginBottom: 12 }}>Trade-by-Trade Audit ({result.trades.length} trades)</h3>
          <div className="trades-table-wrapper">
            <table className="trades-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Dir</th>
                  <th>Entry Bar</th>
                  <th>Exit Bar</th>
                  <th>Entry Price</th>
                  <th>Exit Price</th>
                  <th>Pips</th>
                  <th>P&amp;L</th>
                  <th>Outcome</th>
                  <th>Entry Rationale</th>
                </tr>
              </thead>
              <tbody>
                {result.trades.slice(0, 25).map((t, idx) => (
                  <tr key={idx} className={t.outcome === "WIN" ? "win-row" : "loss-row"}>
                    <td>{idx + 1}</td>
                    <td><span className={`dir-badge ${t.direction.toLowerCase()}`}>{t.direction}</span></td>
                    <td>{t.entryIndex}</td>
                    <td>{t.exitIndex}</td>
                    <td>{t.entryPrice.toFixed(5)}</td>
                    <td>{t.exitPrice.toFixed(5)}</td>
                    <td style={{ color: t.pnlPips >= 0 ? "#37b24d" : "#f03e3e" }}>
                      {t.pnlPips >= 0 ? "+" : ""}{t.pnlPips}
                    </td>
                    <td style={{ color: t.pnlUsd >= 0 ? "#37b24d" : "#f03e3e", fontWeight: 700 }}>
                      {t.pnlUsd >= 0 ? "+" : ""}${t.pnlUsd.toFixed(2)}
                    </td>
                    <td>
                      <span className={`outcome-pill ${t.outcome.toLowerCase()}`}>{t.outcome}</span>
                    </td>
                    <td className="rationale-cell">{t.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.trades.length > 25 && (
              <p className="table-footer-note">Showing first 25 of {result.trades.length} trades. Full audit visible in source.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
