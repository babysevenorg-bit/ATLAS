"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Users, Sparkles, Zap, ShieldCheck } from "lucide-react";

type TickerItem = {
  symbol: string;
  price: number;
  decimals: number;
  changePips: number;
  spread: number;
  direction: "up" | "down" | "neutral";
};

const INITIAL_RATES: TickerItem[] = [
  { symbol: "EUR/USD", price: 1.08524, decimals: 5, changePips: 14.2, spread: 1.1, direction: "up" },
  { symbol: "GBP/USD", price: 1.26418, decimals: 5, changePips: 22.8, spread: 1.4, direction: "up" },
  { symbol: "USD/JPY", price: 150.245, decimals: 3, changePips: -8.4, spread: 1.2, direction: "down" },
  { symbol: "AUD/USD", price: 0.65842, decimals: 5, changePips: 6.1, spread: 1.3, direction: "up" },
  { symbol: "XAU/USD", price: 2341.80, decimals: 2, changePips: 18.5, spread: 2.0, direction: "up" },
  { symbol: "BTC/USD", price: 64850.0, decimals: 1, changePips: 142.0, spread: 5.0, direction: "up" },
];

const COMMUNITY_PULSE = [
  "🟢 1,842 learners active in Academy right now",
  "⚡ Alex M. (London) just completed 'The 1% Risk Rule' (+50 XP)",
  "🎯 Jordan S. (Berlin) scored 100/100 on Support Retest Replay Lab",
  "🏆 Elena T. (Toronto) demonstrated 'Position Sizing Precision'",
  "💡 Marco D. (Rome) completed Diagnostic Assessment (Advanced Level)",
  "🛡️ Sarah K. (Sydney) placed 3 simulated trades with protective stops",
];

export default function LiveMarketTicker() {
  const [rates, setRates] = useState<TickerItem[]>(INITIAL_RATES);
  const [pulseIndex, setPulseIndex] = useState(0);
  const [lastUpdatedSymbol, setLastUpdatedSymbol] = useState<string | null>(null);

  // Simulated live market price ticks
  useEffect(() => {
    const timer = setInterval(() => {
      const targetIdx = Math.floor(Math.random() * INITIAL_RATES.length);
      const isUp = Math.random() > 0.45;
      const tickDelta = (Math.random() * 0.00018 + 0.00004) * (isUp ? 1 : -1);

      setRates(prev => {
        const next = [...prev];
        const item = next[targetIdx];
        const newPrice = Math.max(0.0001, item.price + (item.decimals === 3 ? tickDelta * 100 : item.decimals === 2 ? tickDelta * 1000 : item.decimals === 1 ? tickDelta * 10000 : tickDelta));
        const newPips = Math.round((item.changePips + (isUp ? 0.3 : -0.3)) * 10) / 10;

        next[targetIdx] = {
          ...item,
          price: Math.round(newPrice * Math.pow(10, item.decimals)) / Math.pow(10, item.decimals),
          changePips: newPips,
          direction: isUp ? "up" : "down",
        };
        return next;
      });

      setLastUpdatedSymbol(INITIAL_RATES[targetIdx].symbol);
      setTimeout(() => setLastUpdatedSymbol(null), 900);
    }, 1800);

    return () => clearInterval(timer);
  }, []);

  // Community pulse ticker rotation
  useEffect(() => {
    const pulseTimer = setInterval(() => {
      setPulseIndex(prev => (prev + 1) % COMMUNITY_PULSE.length);
    }, 4500);
    return () => clearInterval(pulseTimer);
  }, []);

  return (
    <div className="live-ticker-bar" aria-label="Real-time simulated rates and learner activity">
      {/* Live Market Rates Rail */}
      <div className="ticker-rates-rail">
        <div className="ticker-live-badge">
          <span className="live-pulse-dot" />
          <span>MARKET PULSE</span>
        </div>

        <div className="ticker-items-scroll">
          {rates.map(item => {
            const isFlashing = lastUpdatedSymbol === item.symbol;
            return (
              <div
                key={item.symbol}
                className={`ticker-chip ${isFlashing ? (item.direction === "up" ? "flash-green" : "flash-red") : ""}`}
              >
                <span className="chip-symbol">{item.symbol}</span>
                <span className="chip-price">{item.price.toFixed(item.decimals)}</span>
                <span className={`chip-change ${item.changePips >= 0 ? "up" : "down"}`}>
                  {item.changePips >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {item.changePips >= 0 ? `+${item.changePips}` : `${item.changePips}`}p
                </span>
                <span className="chip-spread">Sprd: {item.spread}p</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Activity Live Banner */}
      <div className="ticker-community-pulse">
        <div className="pulse-text-container">
          <span className="pulse-message">
            <Sparkles size={12} className="pulse-icon" />
            {COMMUNITY_PULSE[pulseIndex]}
          </span>
        </div>
      </div>
    </div>
  );
}
