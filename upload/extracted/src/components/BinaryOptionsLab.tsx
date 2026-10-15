"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Calculator,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  Layers,
  HelpCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Percent,
  Flame,
  Zap,
  Activity
} from "lucide-react";

type Props = {
  user: { id: string; name: string; virtualBalance: number } | null;
  onTradeCompleted?: () => void;
};

type BinaryContract = {
  id: string;
  asset: string;
  direction: "CALL" | "PUT";
  stake: number;
  strikePrice: number;
  payoutPercent: number;
  expirySeconds: number;
  remainingSeconds: number;
  status: "ACTIVE" | "WIN" | "LOSS" | "TIE";
  expiryPrice?: number;
  netPnl?: number;
};

const BINARY_ASSETS = [
  { symbol: "EUR/USD", name: "Euro / US Dollar", startPrice: 1.08520, decimals: 5, step: 0.00012 },
  { symbol: "GBP/USD", name: "British Pound / USD", startPrice: 1.26410, decimals: 5, step: 0.00018 },
  { symbol: "USD/JPY", name: "USD / Japanese Yen", startPrice: 150.240, decimals: 3, step: 0.04 },
  { symbol: "XAU/USD", name: "Gold / USD", startPrice: 2342.50, decimals: 2, step: 0.6 },
  { symbol: "BTC/USD", name: "Bitcoin / USD", startPrice: 64800.0, decimals: 1, step: 35.0 },
];

export default function BinaryOptionsLab({ user, onTradeCompleted }: Props) {
  const [selectedAssetIdx, setSelectedAssetIdx] = useState(0);
  const activeAsset = BINARY_ASSETS[selectedAssetIdx];

  const [stake, setStake] = useState("50");
  const [payoutPercent, setPayoutPercent] = useState("80");
  const [expirySeconds, setExpirySeconds] = useState(30);

  // Price Feed Simulation
  const [currentPrice, setCurrentPrice] = useState(activeAsset.startPrice);
  const [priceHistory, setPriceHistory] = useState<number[]>([
    activeAsset.startPrice - activeAsset.step,
    activeAsset.startPrice + activeAsset.step * 0.5,
    activeAsset.startPrice
  ]);

  // Active & Completed Contracts
  const [activeContracts, setActiveContracts] = useState<BinaryContract[]>([]);
  const [history, setHistory] = useState<BinaryContract[]>([]);
  const [notice, setNotice] = useState("");

  // Monte Carlo Simulation Tab
  const [activeTab, setActiveTab] = useState<"live_sim" | "monte_carlo">("live_sim");
  const [monteCarloSample, setMonteCarloSample] = useState<number[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset price when switching asset
  useEffect(() => {
    setCurrentPrice(activeAsset.startPrice);
    setPriceHistory([
      activeAsset.startPrice - activeAsset.step,
      activeAsset.startPrice + activeAsset.step * 0.5,
      activeAsset.startPrice
    ]);
  }, [selectedAssetIdx]);

  // Animated Micro Price Generator
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPrice(prev => {
        const delta = (Math.random() - 0.48) * activeAsset.step;
        const next = Math.max(0.001, prev + delta);
        const rounded = Math.round(next * Math.pow(10, activeAsset.decimals)) / Math.pow(10, activeAsset.decimals);
        setPriceHistory(h => [...h.slice(-45), rounded]);
        return rounded;
      });
    }, 900);
    return () => clearInterval(timer);
  }, [activeAsset]);

  // Expiry Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveContracts(prev => {
        const remaining: BinaryContract[] = [];
        prev.forEach(contract => {
          if (contract.remainingSeconds <= 1) {
            resolveContract(contract, currentPrice);
          } else {
            remaining.push({
              ...contract,
              remainingSeconds: contract.remainingSeconds - 1,
            });
          }
        });
        return remaining;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentPrice]);

  // Resolve Expired Contract
  async function resolveContract(contract: BinaryContract, expiryPrice: number) {
    let outcome: "WIN" | "LOSS" | "TIE" = "TIE";
    if (contract.direction === "CALL") {
      if (expiryPrice > contract.strikePrice) outcome = "WIN";
      else if (expiryPrice < contract.strikePrice) outcome = "LOSS";
    } else {
      if (expiryPrice < contract.strikePrice) outcome = "WIN";
      else if (expiryPrice > contract.strikePrice) outcome = "LOSS";
    }

    const netPnl = outcome === "WIN"
      ? (contract.stake * contract.payoutPercent) / 100
      : outcome === "LOSS"
      ? -contract.stake
      : 0;

    const resolved: BinaryContract = {
      ...contract,
      status: outcome,
      expiryPrice,
      netPnl,
      remainingSeconds: 0,
    };

    setHistory(h => [resolved, ...h]);

    if (outcome === "WIN") {
      setNotice(`✅ WIN: Contract payout +$${netPnl.toFixed(2)} received!`);
    } else {
      setNotice(`❌ LOSS: Forfeited -$${Math.abs(netPnl).toFixed(2)} stake.`);
    }
    setTimeout(() => setNotice(""), 3500);

    // Send to backend
    try {
      await fetch("/api/simulation/binary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: contract.asset,
          direction: contract.direction,
          stake: contract.stake,
          strikePrice: contract.strikePrice,
          expiryPrice,
          expirySeconds: contract.expirySeconds,
          payoutPercent: contract.payoutPercent,
        }),
      });
      if (onTradeCompleted) onTradeCompleted();
    } catch {}
  }

  // Submit New Binary Contract
  function placeContract(direction: "CALL" | "PUT") {
    const stakeNum = Number(stake) || 50;
    const payoutNum = Number(payoutPercent) || 80;

    const newContract: BinaryContract = {
      id: Math.random().toString(36).substring(2, 9),
      asset: activeAsset.symbol,
      direction,
      stake: stakeNum,
      strikePrice: currentPrice,
      payoutPercent: payoutNum,
      expirySeconds,
      remainingSeconds: expirySeconds,
      status: "ACTIVE",
    };

    setActiveContracts(prev => [...prev, newContract]);
    setNotice(`Simulated ${direction} contract locked at strike ${currentPrice.toFixed(activeAsset.decimals)}!`);
    setTimeout(() => setNotice(""), 3000);
  }

  // Draw Tick Chart on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (priceHistory.length < 2) return;

    let min = Math.min(...priceHistory);
    let max = Math.max(...priceHistory);
    const pad = (max - min) * 0.15 || 0.0001;
    min -= pad;
    max += pad;
    const range = max - min;

    const getY = (p: number) => height - ((p - min) / range) * (height - 30) - 15;
    const stepX = width / (priceHistory.length - 1);

    // Background Grid
    ctx.strokeStyle = "#1b3831";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let i = 0; i <= 4; i++) {
      const p = min + (range * i) / 4;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      ctx.fillStyle = "#7b9b8d";
      ctx.font = "10px monospace";
      ctx.fillText(p.toFixed(activeAsset.decimals), 10, y - 4);
    }
    ctx.setLineDash([]);

    // Price Gradient Path
    ctx.strokeStyle = "#38d9a9";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    priceHistory.forEach((p, i) => {
      const x = i * stepX;
      const y = getY(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(56, 217, 169, 0.25)");
    grad.addColorStop(1, "rgba(56, 217, 169, 0.0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Active Strike Lines
    activeContracts.forEach(contract => {
      const strikeY = getY(contract.strikePrice);
      ctx.strokeStyle = contract.direction === "CALL" ? "#69db7c" : "#ff8787";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(0, strikeY);
      ctx.lineTo(width, strikeY);
      ctx.stroke();

      ctx.fillStyle = contract.direction === "CALL" ? "#69db7c" : "#ff8787";
      ctx.font = "10px monospace";
      ctx.fillText(
        `${contract.direction} Strike: ${contract.strikePrice.toFixed(activeAsset.decimals)} (${contract.remainingSeconds}s)`,
        width - 240,
        strikeY - 5
      );
      ctx.setLineDash([]);
    });

    // Current Price Pulse Dot
    const lastX = (priceHistory.length - 1) * stepX;
    const lastY = getY(currentPrice);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fill();
  }, [priceHistory, currentPrice, activeContracts, activeAsset]);

  // Expected Value Calculation
  const stakeNum = Number(stake) || 50;
  const payoutNum = Number(payoutPercent) || 80;
  const breakEvenWinRate = (stakeNum / (stakeNum + (stakeNum * payoutNum / 100))) * 100;
  const expectedValuePerTrade = (0.5 * (stakeNum * payoutNum / 100)) + (0.5 * -stakeNum);

  // Monte Carlo 50-bet generator
  function runMonteCarloSim() {
    let bankroll = 1000;
    const curve = [bankroll];
    for (let i = 0; i < 50; i++) {
      const win = Math.random() < 0.50; // Fair 50/50 probability
      if (win) bankroll += (50 * payoutNum) / 100;
      else bankroll -= 50;
      curve.push(Math.round(bankroll));
    }
    setMonteCarloSample(curve);
  }

  // History Statistics
  const totalSimulated = history.length;
  const totalWins = history.filter(h => h.status === "WIN").length;
  const historicalWinRate = totalSimulated > 0 ? (totalWins / totalSimulated) * 100 : 0;
  const cumulativePnl = history.reduce((sum, h) => sum + (h.netPnl || 0), 0);

  return (
    <div className="binary-lab-wrapper">
      {/* Regulatory Disclosure Banner */}
      <div className="binary-alert-card">
        <ShieldAlert size={24} className="alert-icon" />
        <div className="alert-text">
          <h4>Educational Laboratory & Expected Value Simulator</h4>
          <p>
            Binary options are banned for retail consumers across the UK (FCA), EU (ESMA), and Australia (ASIC) because fixed payouts mathematically guarantee long-term negative expectancy. This simulator proves the mathematical house edge with virtual funds.
          </p>
        </div>
      </div>

      {notice && (
        <div className="lab-toast-notice">
          <ShieldCheck size={18} />
          <span>{notice}</span>
        </div>
      )}

      {/* Asset Switcher Pills */}
      <div className="binary-asset-pills-bar">
        {BINARY_ASSETS.map((ast, idx) => (
          <button
            key={ast.symbol}
            onClick={() => setSelectedAssetIdx(idx)}
            className={`asset-pill-btn ${selectedAssetIdx === idx ? "active" : ""}`}
          >
            <strong>{ast.symbol}</strong>
            <span>{ast.name.split("/")[0]}</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Tick Chart + Contract Ticket */}
      <div className="binary-main-grid">
        {/* Left: Tick Feed Canvas */}
        <div className="binary-chart-card">
          <div className="binary-chart-head">
            <div className="asset-tag">
              <Sparkles size={14} />
              <span>{activeAsset.symbol} · High Frequency Micro Feed</span>
            </div>
            <div className="live-price-box">
              <small>LIVE TICK</small>
              <strong>{currentPrice.toFixed(activeAsset.decimals)}</strong>
            </div>
          </div>

          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={820}
              height={320}
              className="binary-canvas"
            />
          </div>

          <div className="binary-math-hud">
            <div className="hud-cell">
              <span>Required Break-Even:</span>
              <strong>{breakEvenWinRate.toFixed(2)}%</strong>
            </div>
            <div className="hud-cell">
              <span>Fair 50/50 EV:</span>
              <strong style={{ color: "#fa5252" }}>
                {expectedValuePerTrade < 0 ? `-$${Math.abs(expectedValuePerTrade).toFixed(2)}` : `$${expectedValuePerTrade.toFixed(2)}`} / trade
              </strong>
            </div>
            <div className="hud-cell">
              <span>Broker Edge:</span>
              <strong>{(100 - payoutNum).toFixed(1)}% House Margin</strong>
            </div>
          </div>
        </div>

        {/* Right: Contract Ticket */}
        <div className="binary-ticket-card">
          <div className="ticket-head">
            <Layers size={18} />
            <span>Simulate Binary Contract</span>
          </div>

          <div className="binary-field">
            <label>Expiry Window:</label>
            <div className="expiry-pills">
              {[
                { sec: 15, label: "15s" },
                { sec: 30, label: "30s" },
                { sec: 60, label: "60s" },
                { sec: 120, label: "2m" }
              ].map(item => (
                <button
                  key={item.sec}
                  onClick={() => setExpirySeconds(item.sec)}
                  className={`expiry-pill ${expirySeconds === item.sec ? "active" : ""}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="binary-field">
            <label>Virtual Stake ($):</label>
            <div className="input-with-affix">
              <input
                type="number"
                min="10"
                max="500"
                step="10"
                value={stake}
                onChange={e => setStake(e.target.value)}
              />
              <span>USD</span>
            </div>
          </div>

          <div className="binary-field">
            <label>Broker Payout (%):</label>
            <div className="input-with-affix">
              <input
                type="number"
                min="60"
                max="95"
                step="5"
                value={payoutPercent}
                onChange={e => setPayoutPercent(e.target.value)}
              />
              <span>% on Win</span>
            </div>
          </div>

          <div className="payout-summary-box">
            <div className="payout-row">
              <span>If Prediction Correct:</span>
              <strong style={{ color: "#69db7c" }}>
                +${((stakeNum * payoutNum) / 100).toFixed(2)} (Total ${(stakeNum + (stakeNum * payoutNum) / 100).toFixed(2)})
              </strong>
            </div>
            <div className="payout-row">
              <span>If Prediction Incorrect:</span>
              <strong style={{ color: "#ff8787" }}>
                -${stakeNum.toFixed(2)} (100% loss of stake)
              </strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="binary-actions-grid">
            <button
              onClick={() => placeContract("CALL")}
              className="binary-action-btn call"
            >
              <TrendingUp size={20} />
              <div>
                <strong>CALL (HIGHER)</strong>
                <small>Expect price &gt; {currentPrice.toFixed(activeAsset.decimals)}</small>
              </div>
            </button>

            <button
              onClick={() => placeContract("PUT")}
              className="binary-action-btn put"
            >
              <TrendingDown size={20} />
              <div>
                <strong>PUT (LOWER)</strong>
                <small>Expect price &lt; {currentPrice.toFixed(activeAsset.decimals)}</small>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Active Contracts Ladder & Monte Carlo Proof */}
      <div className="binary-bottom-grid">
        {/* Active Timers */}
        <div className="binary-table-card">
          <h4>Active Expiring Contracts ({activeContracts.length})</h4>
          {activeContracts.length === 0 ? (
            <div className="empty-table-msg">No active contracts running. Choose Call or Put above to test the math.</div>
          ) : (
            <div className="active-contracts-list">
              {activeContracts.map(contract => (
                <div key={contract.id} className="active-contract-row">
                  <span className={`contract-badge ${contract.direction.toLowerCase()}`}>
                    {contract.direction} ${contract.stake}
                  </span>
                  <span>Strike: <strong>{contract.strikePrice.toFixed(activeAsset.decimals)}</strong></span>
                  <span>Current: <strong>{currentPrice.toFixed(activeAsset.decimals)}</strong></span>
                  <div className="timer-badge">
                    <Clock size={13} />
                    <strong>{contract.remainingSeconds}s left</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aggregate Empirical Statistics & Monte Carlo Simulator */}
        <div className="binary-stats-card">
          <div className="stats-head-row">
            <h4>Monte Carlo House Edge Proof</h4>
            <button onClick={runMonteCarloSim} className="btn-monte-carlo">
              Simulate 50 Bets <Zap size={13} />
            </button>
          </div>

          {monteCarloSample.length > 0 ? (
            <div className="monte-carlo-result-box">
              <div className="mc-stat-row">
                <span>Starting Bankroll: $1,000</span>
                <span>Final: <strong style={{ color: monteCarloSample[monteCarloSample.length - 1] >= 1000 ? "#69db7c" : "#fa5252" }}>${monteCarloSample[monteCarloSample.length - 1]}</strong></span>
              </div>
              <div className="mc-curve-preview">
                {monteCarloSample.map((val, i) => (
                  <div
                    key={i}
                    className="mc-bar"
                    style={{
                      height: `${Math.min(100, Math.max(10, (val / 1200) * 100))}%`,
                      background: val >= 1000 ? "#69db7c" : "#fa5252"
                    }}
                  />
                ))}
              </div>
              <p className="mc-caption">50 bets under 80% payout with 50/50 fair coin flips. Notice the steady capital erosion caused by -EV.</p>
            </div>
          ) : (
            <div className="stats-metric-grid">
              <div className="stat-cell">
                <span>Contracts Evaluated</span>
                <strong>{totalSimulated}</strong>
              </div>
              <div className="stat-cell">
                <span>Observed Win Rate</span>
                <strong style={{ color: historicalWinRate >= breakEvenWinRate ? "#69db7c" : "#ff8787" }}>
                  {historicalWinRate.toFixed(1)}%
                </strong>
                <small>Need {breakEvenWinRate.toFixed(1)}% to break even</small>
              </div>
              <div className="stat-cell">
                <span>Cumulative Virtual P&L</span>
                <strong style={{ color: cumulativePnl >= 0 ? "#69db7c" : "#ff8787" }}>
                  {cumulativePnl >= 0 ? `+$${cumulativePnl.toFixed(2)}` : `-$${Math.abs(cumulativePnl).toFixed(2)}`}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
