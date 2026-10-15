"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Calculator,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  HelpCircle,
  FileText,
  DollarSign,
  Maximize2,
  Sliders,
  Crosshair,
  Award,
  Zap,
  Flame,
  BarChart3,
  Percent,
  Check,
  X,
  Target,
  PenTool,
  LockKeyhole,
  Activity
} from "lucide-react";
import {
  REPLAY_INSTRUMENTS,
  SIMULATION_CHALLENGES,
  type Instrument,
  type Candle,
  type SimulationChallenge,
  type DrawingItem,
  type DrawingToolType
} from "@/lib/marketData";

type Order = {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  orderType?: "MARKET" | "LIMIT" | "STOP";
  lots: number;
  openPrice: number;
  closePrice?: number;
  sl?: number | null;
  tp?: number | null;
  status: "OPEN" | "CLOSED" | "PENDING";
  pnl: number;
  pips: number;
  openTime: string;
  closeTime?: string;
  setupNote?: string;
  riskPercentage?: number;
  processScore?: number;
};

type Props = {
  user: { id: string; name: string; role: string; virtualBalance: number } | null;
  onTradeCompleted?: () => void;
};

export default function TradingLab({ user, onTradeCompleted }: Props) {
  const [activeLabTab, setActiveLabTab] = useState<"terminal" | "challenges" | "analytics">("terminal");
  const [selectedSymbol, setSelectedSymbol] = useState("EUR/USD");
  const instrument = REPLAY_INSTRUMENTS.find(i => i.symbol === selectedSymbol) || REPLAY_INSTRUMENTS[0];

  // Replay State
  const [replayIndex, setReplayIndex] = useState(instrument.initialReplayIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<0.5 | 1 | 2 | 5>(1);

  // Timeframe selector
  const [timeframe, setTimeframe] = useState<"5M" | "15M" | "1H" | "4H">("15M");

  // Indicators State
  const [showSMA20, setShowSMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(false);

  // Drawing Tools State
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>("none");
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [drawingStart, setDrawingStart] = useState<{ price: number; index: number } | null>(null);

  // Account State
  const [balance, setBalance] = useState(user?.virtualBalance || 10000);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);

  // Order Ticket State
  const [orderDirection, setOrderDirection] = useState<"BUY" | "SELL">("BUY");
  const [orderExecutionType, setOrderExecutionType] = useState<"MARKET" | "LIMIT" | "STOP">("MARKET");
  const [limitTriggerPrice, setLimitTriggerPrice] = useState("");
  const [lots, setLots] = useState("0.20");
  const [slPrice, setSlPrice] = useState("");
  const [tpPrice, setTpPrice] = useState("");
  const [riskPercent, setRiskPercent] = useState("1.0");
  const [setupNote, setSetupNote] = useState("");
  const [emotionalChecks, setEmotionalChecks] = useState<{
    discipline: boolean;
    noFomo: boolean;
    riskManaged: boolean;
  }>({ discipline: true, noFomo: true, riskManaged: true });

  const [showJournalModal, setShowJournalModal] = useState(false);
  const [orderNotice, setOrderNotice] = useState("");

  // Active Challenge State
  const [activeChallenge, setActiveChallenge] = useState<SimulationChallenge | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load orders on mount
  useEffect(() => {
    fetch("/api/simulation/orders")
      .then(res => res.json())
      .then(data => {
        if (data.orders) {
          setOrders(data.orders.map((o: any) => ({
            ...o,
            pnl: Number(o.pnl),
            pips: Number(o.pips),
            lots: Number(o.lots),
            openPrice: Number(o.openPrice),
            closePrice: o.closePrice ? Number(o.closePrice) : undefined,
            sl: o.sl ? Number(o.sl) : null,
            tp: o.tp ? Number(o.tp) : null,
          })));
        }
        if (data.balance) setBalance(data.balance);
      })
      .catch(() => {});
  }, [user]);

  // Reset index when instrument changes
  useEffect(() => {
    setReplayIndex(instrument.initialReplayIndex);
    setIsPlaying(false);
    setDrawings([]);
    setDrawingStart(null);
  }, [selectedSymbol]);

  // Replay Timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = playSpeed === 0.5 ? 2000 : playSpeed === 1 ? 1200 : playSpeed === 2 ? 600 : 250;
    const timer = setInterval(() => {
      setReplayIndex(prev => {
        if (prev >= instrument.candles.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, instrument.candles.length]);

  // Visible Candles without look-ahead bias
  const visibleCandles = useMemo(() => {
    return instrument.candles.slice(0, replayIndex + 1);
  }, [instrument.candles, replayIndex]);

  const currentCandle = visibleCandles[visibleCandles.length - 1];
  const currentPrice = currentCandle ? currentCandle.close : 1.0850;

  // Auto-check SL/TP on replay step
  useEffect(() => {
    if (!currentCandle) return;
    const openOrders = orders.filter(o => o.status === "OPEN" && o.symbol === selectedSymbol);
    openOrders.forEach(order => {
      let triggeredClose = false;
      let closePrice = currentCandle.close;
      let reason = "MANUAL";

      if (order.type === "BUY") {
        if (order.sl && currentCandle.low <= order.sl) {
          triggeredClose = true;
          closePrice = order.sl;
          reason = "SL_HIT";
        } else if (order.tp && currentCandle.high >= order.tp) {
          triggeredClose = true;
          closePrice = order.tp;
          reason = "TP_HIT";
        }
      } else {
        if (order.sl && currentCandle.high >= order.sl) {
          triggeredClose = true;
          closePrice = order.sl;
          reason = "SL_HIT";
        } else if (order.tp && currentCandle.low <= order.tp) {
          triggeredClose = true;
          closePrice = order.tp;
          reason = "TP_HIT";
        }
      }

      if (triggeredClose) {
        closePosition(order.id, closePrice, reason);
      }
    });
  }, [replayIndex]);

  // Position Sizing calculations
  const calculatedRiskBudget = (balance * (Number(riskPercent) || 1)) / 100;
  const stopDistancePips = useMemo(() => {
    if (!slPrice || isNaN(Number(slPrice))) return 0;
    const diff = Math.abs(currentPrice - Number(slPrice));
    return Math.round((diff / instrument.pipSize) * 10) / 10;
  }, [slPrice, currentPrice, instrument.pipSize]);

  const recommendedLots = useMemo(() => {
    if (stopDistancePips <= 0) return 0.1;
    const pipVal = instrument.pipValueStandard;
    const calc = calculatedRiskBudget / (stopDistancePips * pipVal);
    return Math.max(0.01, Math.min(20, Math.round(calc * 100) / 100));
  }, [calculatedRiskBudget, stopDistancePips, instrument.pipValueStandard]);

  function autoApplyRecommendedLots() {
    setLots(recommendedLots.toFixed(2));
  }

  // Account Margin telemetry
  const openOrders = orders.filter(o => o.status === "OPEN");
  const closedOrders = orders.filter(o => o.status === "CLOSED");

  const floatingPnL = useMemo(() => {
    return openOrders.reduce((sum, order) => {
      const isJpy = order.symbol.includes("JPY");
      const pipMultiplier = isJpy ? 100 : 10000;
      const diff = order.type === "BUY" ? (currentPrice - order.openPrice) : (order.openPrice - currentPrice);
      const pips = diff * pipMultiplier;
      const pipVal = isJpy ? (1000 / currentPrice) : 10;
      return sum + pips * (order.lots * pipVal);
    }, 0);
  }, [openOrders, currentPrice]);

  const equity = balance + floatingPnL;
  const marginUsed = openOrders.reduce((sum, o) => sum + (o.lots * 100000) / 30, 0);
  const freeMargin = Math.max(0, equity - marginUsed);
  const marginLevelPercent = marginUsed > 0 ? Math.round((equity / marginUsed) * 100) : 999;

  // Chart Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (visibleCandles.length < 2) return;

    const windowSize = Math.min(visibleCandles.length, 55);
    const windowCandles = visibleCandles.slice(-windowSize);

    let minPrice = Math.min(...windowCandles.map(c => c.low));
    let maxPrice = Math.max(...windowCandles.map(c => c.high));

    const pricePadding = (maxPrice - minPrice) * 0.12 || 0.001;
    minPrice -= pricePadding;
    maxPrice += pricePadding;
    const priceRange = maxPrice - minPrice;

    // Layout Heights
    const hasSubchart = showRSI || showMACD;
    const chartHeight = hasSubchart ? height * 0.68 : height - 30;
    const subchartTop = chartHeight + 15;
    const subchartHeight = height - subchartTop - 12;

    const getY = (price: number) => chartHeight - ((price - minPrice) / priceRange) * chartHeight + 10;
    const candleWidth = (width - 70) / windowSize;

    // Grid Lines
    ctx.strokeStyle = "#1b3831";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const p = minPrice + (priceRange * i) / steps;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 65, y);
      ctx.stroke();

      ctx.fillStyle = "#7b9b8d";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(p.toFixed(instrument.pipSize === 0.01 ? 2 : instrument.pipSize === 1.0 ? 1 : 4), width - 60, y + 3);
    }
    ctx.setLineDash([]);

    // Volume Bars Overlay (at bottom of main chart)
    if (showVolume) {
      const maxVol = Math.max(...windowCandles.map(c => c.volume)) || 1;
      const volH = chartHeight * 0.2;
      windowCandles.forEach((c, i) => {
        const x = i * candleWidth + candleWidth / 2;
        const vHeight = (c.volume / maxVol) * volH;
        ctx.fillStyle = c.close >= c.open ? "rgba(105, 219, 124, 0.15)" : "rgba(255, 107, 107, 0.15)";
        ctx.fillRect(x - candleWidth * 0.35, chartHeight - vHeight, candleWidth * 0.7, vHeight);
      });
    }

    // Bollinger Bands (20 periods, 2 std dev)
    if (showBollinger && visibleCandles.length >= 20) {
      ctx.strokeStyle = "rgba(56, 217, 169, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();

      windowCandles.forEach((_, winIdx) => {
        const globalIdx = visibleCandles.length - windowSize + winIdx;
        if (globalIdx >= 19) {
          const slice = visibleCandles.slice(globalIdx - 19, globalIdx + 1);
          const mean = slice.reduce((a, b) => a + b.close, 0) / 20;
          const variance = slice.reduce((a, b) => a + Math.pow(b.close - mean, 2), 0) / 20;
          const std = Math.sqrt(variance);
          const upper = mean + 2 * std;
          const x = winIdx * candleWidth + candleWidth / 2;
          if (winIdx === 0) ctx.moveTo(x, getY(upper));
          else ctx.lineTo(x, getY(upper));
        }
      });
      ctx.stroke();

      ctx.beginPath();
      windowCandles.forEach((_, winIdx) => {
        const globalIdx = visibleCandles.length - windowSize + winIdx;
        if (globalIdx >= 19) {
          const slice = visibleCandles.slice(globalIdx - 19, globalIdx + 1);
          const mean = slice.reduce((a, b) => a + b.close, 0) / 20;
          const variance = slice.reduce((a, b) => a + Math.pow(b.close - mean, 2), 0) / 20;
          const std = Math.sqrt(variance);
          const lower = mean - 2 * std;
          const x = winIdx * candleWidth + candleWidth / 2;
          if (winIdx === 0) ctx.moveTo(x, getY(lower));
          else ctx.lineTo(x, getY(lower));
        }
      });
      ctx.stroke();
    }

    // Candlesticks
    windowCandles.forEach((c, i) => {
      const x = i * candleWidth + candleWidth / 2;
      const isBull = c.close >= c.open;
      const color = isBull ? "#69db7c" : "#ff6b6b";

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, getY(c.high));
      ctx.lineTo(x, getY(c.low));
      ctx.stroke();

      // Body
      const topY = getY(Math.max(c.open, c.close));
      const botY = getY(Math.min(c.open, c.close));
      const bodyH = Math.max(2, botY - topY);

      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth * 0.35, topY, candleWidth * 0.7, bodyH);
    });

    // SMA 20 Overlay
    if (showSMA20 && visibleCandles.length >= 20) {
      ctx.strokeStyle = "#4dabf7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      windowCandles.forEach((_, winIdx) => {
        const globalIdx = visibleCandles.length - windowSize + winIdx;
        if (globalIdx >= 19) {
          const slice = visibleCandles.slice(globalIdx - 19, globalIdx + 1);
          const sma = slice.reduce((a, b) => a + b.close, 0) / 20;
          const x = winIdx * candleWidth + candleWidth / 2;
          const y = getY(sma);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // EMA 50 Overlay
    if (showEMA50 && visibleCandles.length >= 30) {
      ctx.strokeStyle = "#ffd43b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      const k = 2 / (50 + 1);
      let prevEma = visibleCandles[0].close;

      visibleCandles.forEach((c, globalIdx) => {
        prevEma = c.close * k + prevEma * (1 - k);
        const winIdx = globalIdx - (visibleCandles.length - windowSize);
        if (winIdx >= 0) {
          const x = winIdx * candleWidth + candleWidth / 2;
          const y = getY(prevEma);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Open Orders Lines & Visual Execution Markers
    const currentSymbolOrders = orders.filter(o => o.status === "OPEN" && o.symbol === selectedSymbol);
    currentSymbolOrders.forEach(order => {
      const entryY = getY(order.openPrice);

      // Entry line
      ctx.strokeStyle = "#38d9a9";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(width - 65, entryY);
      ctx.stroke();
      ctx.fillStyle = "#38d9a9";
      ctx.fillText(`▲ ${order.type} ${order.lots}L @ ${order.openPrice.toFixed(4)}`, 10, entryY - 4);

      // SL line & Stop Box
      if (order.sl) {
        const slY = getY(order.sl);
        ctx.strokeStyle = "#ff8787";
        ctx.beginPath();
        ctx.moveTo(0, slY);
        ctx.lineTo(width - 65, slY);
        ctx.stroke();
        ctx.fillStyle = "#ff8787";
        ctx.fillText(`SL: ${order.sl.toFixed(4)}`, 10, slY - 4);

        // Fill Risk Zone
        ctx.fillStyle = "rgba(255, 107, 107, 0.08)";
        ctx.fillRect(0, Math.min(entryY, slY), width - 65, Math.abs(entryY - slY));
      }

      // TP line & Profit Box
      if (order.tp) {
        const tpY = getY(order.tp);
        ctx.strokeStyle = "#69db7c";
        ctx.beginPath();
        ctx.moveTo(0, tpY);
        ctx.lineTo(width - 65, tpY);
        ctx.stroke();
        ctx.fillStyle = "#69db7c";
        ctx.fillText(`TP: ${order.tp.toFixed(4)}`, 10, tpY - 4);

        // Fill Reward Zone
        ctx.fillStyle = "rgba(105, 219, 124, 0.08)";
        ctx.fillRect(0, Math.min(entryY, tpY), width - 65, Math.abs(entryY - tpY));
      }
      ctx.setLineDash([]);
    });

    // Custom Technical Drawings Rendering
    drawings.forEach(d => {
      if (d.type === "horizontal_ray") {
        const y = getY(d.price1);
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width - 65, y);
        ctx.stroke();
        ctx.fillStyle = d.color;
        ctx.fillText(`Ray: ${d.price1.toFixed(4)}`, width - 140, y - 4);
      } else if (d.type === "fibonacci" && d.price2) {
        const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
        const diff = d.price2 - d.price1;
        fibLevels.forEach(fib => {
          const fibPrice = d.price1 + diff * fib;
          const y = getY(fibPrice);
          ctx.strokeStyle = fib === 0.5 || fib === 0.618 ? "#ffd43b" : "rgba(177, 151, 252, 0.5)";
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width - 65, y);
          ctx.stroke();
          ctx.fillStyle = "#ffd43b";
          ctx.fillText(`Fib ${(fib * 100).toFixed(1)}% (${fibPrice.toFixed(4)})`, 10, y - 3);
        });
        ctx.setLineDash([]);
      }
    });

    // Subcharts: RSI 14
    if (showRSI && visibleCandles.length >= 14) {
      ctx.fillStyle = "#0c1d1a";
      ctx.fillRect(0, subchartTop, width - 65, subchartHeight);

      ctx.strokeStyle = "#1e3e36";
      ctx.setLineDash([3, 3]);
      const y70 = subchartTop + subchartHeight * 0.3;
      const y30 = subchartTop + subchartHeight * 0.7;
      ctx.beginPath(); ctx.moveTo(0, y70); ctx.lineTo(width - 65, y70); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y30); ctx.lineTo(width - 65, y30); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#748f81";
      ctx.font = "9px monospace";
      ctx.fillText("RSI (14)", 8, subchartTop + 10);
      ctx.fillText("70", width - 60, y70 + 3);
      ctx.fillText("30", width - 60, y30 + 3);

      ctx.strokeStyle = "#b197fc";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let startedRsi = false;

      windowCandles.forEach((_, winIdx) => {
        const globalIdx = visibleCandles.length - windowSize + winIdx;
        if (globalIdx >= 14) {
          const slice = visibleCandles.slice(globalIdx - 14, globalIdx + 1);
          let gains = 0, losses = 0;
          for (let j = 1; j < slice.length; j++) {
            const diff = slice[j].close - slice[j - 1].close;
            if (diff >= 0) gains += diff;
            else losses += Math.abs(diff);
          }
          const rs = gains / (losses || 0.00001);
          const rsiVal = 100 - (100 / (1 + rs));
          const x = winIdx * candleWidth + candleWidth / 2;
          const y = subchartTop + subchartHeight * (1 - rsiVal / 100);
          if (!startedRsi) { ctx.moveTo(x, y); startedRsi = true; }
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }
  }, [
    visibleCandles,
    showSMA20,
    showEMA50,
    showBollinger,
    showVolume,
    showRSI,
    showMACD,
    orders,
    selectedSymbol,
    drawings
  ]);

  // Click on chart handler for drawing tools
  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || activeDrawingTool === "none") return;
    const rect = canvas.getBoundingClientRect();
    const clickY = e.clientY - rect.top;

    const windowSize = Math.min(visibleCandles.length, 55);
    const windowCandles = visibleCandles.slice(-windowSize);
    let minPrice = Math.min(...windowCandles.map(c => c.low));
    let maxPrice = Math.max(...windowCandles.map(c => c.high));
    const pricePadding = (maxPrice - minPrice) * 0.12 || 0.001;
    minPrice -= pricePadding;
    maxPrice += pricePadding;

    const chartHeight = (showRSI || showMACD) ? canvas.height * 0.68 : canvas.height - 30;
    const clickedPrice = minPrice + (1 - (clickY - 10) / chartHeight) * (maxPrice - minPrice);

    if (activeDrawingTool === "horizontal_ray") {
      setDrawings(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          type: "horizontal_ray",
          price1: clickedPrice,
          index1: replayIndex,
          color: "#ffd43b",
        }
      ]);
      setOrderNotice(`Placed Support/Resistance Ray at ${clickedPrice.toFixed(4)}`);
      setTimeout(() => setOrderNotice(""), 3000);
    } else if (activeDrawingTool === "fibonacci") {
      if (!drawingStart) {
        setDrawingStart({ price: clickedPrice, index: replayIndex });
        setOrderNotice("Click second point on chart to complete Fibonacci Retracement.");
      } else {
        setDrawings(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            type: "fibonacci",
            price1: drawingStart.price,
            price2: clickedPrice,
            index1: drawingStart.index,
            index2: replayIndex,
            color: "#ffd43b",
          }
        ]);
        setDrawingStart(null);
        setActiveDrawingTool("none");
      }
    }
  }

  // Submit Order API
  async function submitOrder() {
    if (!setupNote.trim()) {
      setOrderNotice("Please enter your pre-trade rationale before executing.");
      return;
    }

    const payload = {
      symbol: selectedSymbol,
      type: orderDirection,
      orderType: orderExecutionType,
      lots: Number(lots) || 0.1,
      openPrice: orderExecutionType === "MARKET" ? currentPrice : Number(limitTriggerPrice) || currentPrice,
      sl: slPrice ? Number(slPrice) : null,
      tp: tpPrice ? Number(tpPrice) : null,
      setupNote: setupNote.trim(),
      riskPercentage: Number(riskPercent) || 1.0,
    };

    try {
      const res = await fetch("/api/simulation/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrderNotice(data.error || "Order execution rejected.");
        return;
      }

      setOrders(prev => [data.order, ...prev]);
      setShowJournalModal(false);
      setSetupNote("");
      setOrderNotice(`Simulated ${orderDirection} ${lots}L executed at ${currentPrice.toFixed(4)}!`);
      setTimeout(() => setOrderNotice(""), 4000);
    } catch {
      setOrderNotice("Unable to execute order.");
    }
  }

  // Close Order API
  async function closePosition(orderId: string, exitPrice?: number, reason = "MANUAL") {
    const finalPrice = exitPrice || currentPrice;
    try {
      const res = await fetch("/api/simulation/orders/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          closePrice: finalPrice,
          closeReason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrderNotice(data.error || "Failed to close position.");
        return;
      }

      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: "CLOSED",
        closePrice: finalPrice,
        pnl: data.pnl,
        pips: data.pips,
        processScore: data.processScore,
      } : o));

      setBalance(b => b + data.pnl);

      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        setSelectedOrderForReview({
          ...targetOrder,
          closePrice: finalPrice,
          pnl: data.pnl,
          pips: data.pips,
          processScore: data.processScore,
        });
      }

      if (onTradeCompleted) onTradeCompleted();
    } catch {
      setOrderNotice("Unable to close position.");
    }
  }

  // Break-Even Stop Loss button
  async function setBreakEvenSL(orderId: string) {
    try {
      const res = await fetch("/api/simulation/orders/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "SET_BREAK_EVEN" }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, sl: data.sl } : o));
        setOrderNotice(data.message);
        setTimeout(() => setOrderNotice(""), 3500);
      }
    } catch {}
  }

  // Partial Close 50% button
  async function partialClose50(orderId: string) {
    try {
      const res = await fetch("/api/simulation/orders/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          action: "PARTIAL_CLOSE",
          currentPrice,
          percent: 50,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, lots: data.remainingLots } : o));
        setBalance(b => b + data.realizedPnl);
        setOrderNotice(data.message);
        setTimeout(() => setOrderNotice(""), 3500);
      }
    } catch {}
  }

  // Analytics Computations
  const totalTradesCount = closedOrders.length;
  const winningTrades = closedOrders.filter(o => o.pnl > 0);
  const losingTrades = closedOrders.filter(o => o.pnl < 0);
  const winRate = totalTradesCount > 0 ? Math.round((winningTrades.length / totalTradesCount) * 100) : 0;

  const grossProfit = winningTrades.reduce((a, b) => a + b.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((a, b) => a + b.pnl, 0));
  const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? 99 : 0;
  const netVirtualPnl = closedOrders.reduce((a, b) => a + b.pnl, 0);
  const avgProcessScore = totalTradesCount > 0 ? Math.round(closedOrders.reduce((a, b) => a + (b.processScore || 100), 0) / totalTradesCount) : 100;

  return (
    <div className="trading-lab-container">
      {/* Top Replay HUD & Scenario Header */}
      <div className="lab-header-card">
        <div className="lab-header-main">
          {/* Instrument Selector Rails */}
          <div className="instrument-selector-group">
            {REPLAY_INSTRUMENTS.map(inst => (
              <button
                key={inst.symbol}
                onClick={() => setSelectedSymbol(inst.symbol)}
                className={`inst-pill ${selectedSymbol === inst.symbol ? "active" : ""}`}
              >
                <strong>{inst.symbol}</strong>
                <span>{inst.category}</span>
              </button>
            ))}
          </div>

          <div className="scenario-details">
            <div className="scenario-tag">
              <Sparkles size={14} /> HISTORICAL REPLAY LAB · ZERO LOOK-AHEAD BIAS
            </div>
            <h3>{instrument.scenarioTitle}</h3>
            <p>{instrument.scenarioDescription}</p>
          </div>
        </div>

        {/* Live Account Telemetry HUD */}
        <div className="account-hud">
          <div className="hud-metric">
            <span>BALANCE</span>
            <strong>${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
          <div className="hud-metric">
            <span>EQUITY</span>
            <strong style={{ color: floatingPnL >= 0 ? "#82c91e" : "#fa5252" }}>
              ${equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="hud-metric">
            <span>MARGIN USED</span>
            <strong>${marginUsed.toFixed(2)} ({marginLevelPercent}%)</strong>
          </div>
          <div className="hud-metric">
            <span>FLOATING P&L</span>
            <span className={`hud-badge ${floatingPnL >= 0 ? "profit" : "loss"}`}>
              {floatingPnL >= 0 ? `+$${floatingPnL.toFixed(2)}` : `-$${Math.abs(floatingPnL).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Lab Nav Tabs */}
      <div className="lab-subtabs-row">
        <button
          onClick={() => setActiveLabTab("terminal")}
          className={`lab-subtab-btn ${activeLabTab === "terminal" ? "active" : ""}`}
        >
          <Activity size={15} /> Replay Terminal
        </button>
        <button
          onClick={() => setActiveLabTab("challenges")}
          className={`lab-subtab-btn ${activeLabTab === "challenges" ? "active" : ""}`}
        >
          <Award size={15} /> Guided Challenges
        </button>
        <button
          onClick={() => setActiveLabTab("analytics")}
          className={`lab-subtab-btn ${activeLabTab === "analytics" ? "active" : ""}`}
        >
          <BarChart3 size={15} /> Performance & Discipline Analytics
        </button>
      </div>

      {orderNotice && (
        <div className="lab-toast-notice">
          <ShieldCheck size={18} />
          <span>{orderNotice}</span>
        </div>
      )}

      {/* TAB 1: MAIN TERMINAL */}
      {activeLabTab === "terminal" && (
        <>
          <div className="lab-main-layout">
            {/* Chart Panel */}
            <div className="chart-panel-card">
              {/* Replay Controls Toolbar */}
              <div className="replay-toolbar">
                <div className="replay-controls-left">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`replay-btn play ${isPlaying ? "playing" : ""}`}
                    title={isPlaying ? "Pause Replay" : "Play Replay"}
                  >
                    {isPlaying ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
                    <span>{isPlaying ? "Pause" : "Play Replay"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setReplayIndex(prev => Math.min(instrument.candles.length - 1, prev + 1));
                    }}
                    disabled={replayIndex >= instrument.candles.length - 1}
                    className="replay-btn step"
                    title="Advance 1 Candle Forward"
                  >
                    <SkipForward size={15} />
                    <span>Next Bar</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setReplayIndex(instrument.initialReplayIndex);
                    }}
                    className="replay-btn reset"
                    title="Rewind to Decision Point"
                  >
                    <RotateCcw size={14} />
                    <span>Rewind</span>
                  </button>

                  {/* Playback speed */}
                  <div className="speed-pills">
                    {([0.5, 1, 2, 5] as const).map(spd => (
                      <button
                        key={spd}
                        onClick={() => setPlaySpeed(spd)}
                        className={`speed-pill ${playSpeed === spd ? "active" : ""}`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="replay-status-right">
                  {/* Drawing Tools Selector */}
                  <div className="drawing-tools-bar">
                    <button
                      onClick={() => setActiveDrawingTool(activeDrawingTool === "horizontal_ray" ? "none" : "horizontal_ray")}
                      className={`draw-tool-btn ${activeDrawingTool === "horizontal_ray" ? "active" : ""}`}
                      title="Place Horizontal Support/Resistance Ray"
                    >
                      <Crosshair size={13} /> S/R Ray
                    </button>
                    <button
                      onClick={() => setActiveDrawingTool(activeDrawingTool === "fibonacci" ? "none" : "fibonacci")}
                      className={`draw-tool-btn ${activeDrawingTool === "fibonacci" ? "active" : ""}`}
                      title="Draw Fibonacci Retracement"
                    >
                      <Layers size={13} /> Fib
                    </button>
                    {drawings.length > 0 && (
                      <button onClick={() => setDrawings([])} className="draw-tool-btn clear">
                        Clear ({drawings.length})
                      </button>
                    )}
                  </div>

                  {/* Indicator Toggles */}
                  <div className="indicator-toggles">
                    <button
                      onClick={() => setShowSMA20(!showSMA20)}
                      className={`ind-pill ${showSMA20 ? "active" : ""}`}
                      style={{ borderColor: showSMA20 ? "#4dabf7" : undefined }}
                    >
                      SMA 20
                    </button>
                    <button
                      onClick={() => setShowEMA50(!showEMA50)}
                      className={`ind-pill ${showEMA50 ? "active" : ""}`}
                      style={{ borderColor: showEMA50 ? "#ffd43b" : undefined }}
                    >
                      EMA 50
                    </button>
                    <button
                      onClick={() => setShowBollinger(!showBollinger)}
                      className={`ind-pill ${showBollinger ? "active" : ""}`}
                    >
                      Boll
                    </button>
                    <button
                      onClick={() => setShowRSI(!showRSI)}
                      className={`ind-pill ${showRSI ? "active" : ""}`}
                      style={{ borderColor: showRSI ? "#b197fc" : undefined }}
                    >
                      RSI
                    </button>
                  </div>
                </div>
              </div>

              {/* Canvas Interactive Chart */}
              <div className="canvas-wrapper">
                <canvas
                  ref={canvasRef}
                  width={880}
                  height={430}
                  onClick={handleCanvasClick}
                  className="chart-canvas"
                />
                <div className="watermark-symbol">{selectedSymbol}</div>
              </div>

              {/* Zero Look-Ahead Bias Guarantee */}
              <div className="replay-footer-notice">
                <ShieldCheck size={16} />
                <span>
                  <strong>Anti-Hindsight Engine:</strong> Future candlesticks are strictly hidden. Decisions must be made under authentic market uncertainty.
                </span>
              </div>
            </div>

            {/* Order Ticket Panel */}
            <div className="order-panel-card">
              <div className="order-ticket-head">
                <div className="ticket-title">
                  <Layers size={18} />
                  <span>Execution Ticket</span>
                </div>
                <div className="current-quote">
                  <small>{selectedSymbol}</small>
                  <strong>{currentPrice.toFixed(instrument.pipSize === 0.01 ? 2 : 4)}</strong>
                </div>
              </div>

              {/* Order Execution Type (Market / Limit / Stop) */}
              <div className="exec-type-tabs">
                {(["MARKET", "LIMIT", "STOP"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setOrderExecutionType(type)}
                    className={`exec-type-btn ${orderExecutionType === type ? "active" : ""}`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {orderExecutionType !== "MARKET" && (
                <div className="calc-row">
                  <label>Pending Trigger Price:</label>
                  <input
                    type="number"
                    step={instrument.pipSize === 0.01 ? "0.01" : "0.0001"}
                    placeholder={currentPrice.toFixed(4)}
                    value={limitTriggerPrice}
                    onChange={e => setLimitTriggerPrice(e.target.value)}
                  />
                </div>
              )}

              {/* Direction Buttons */}
              <div className="direction-toggle-grid">
                <button
                  onClick={() => setOrderDirection("BUY")}
                  className={`dir-btn buy ${orderDirection === "BUY" ? "active" : ""}`}
                >
                  <TrendingUp size={18} />
                  <div>
                    <strong>BUY (Long)</strong>
                    <small>Ask: {(currentPrice + instrument.defaultSpread * instrument.pipSize).toFixed(4)}</small>
                  </div>
                </button>

                <button
                  onClick={() => setOrderDirection("SELL")}
                  className={`dir-btn sell ${orderDirection === "SELL" ? "active" : ""}`}
                >
                  <TrendingDown size={18} />
                  <div>
                    <strong>SELL (Short)</strong>
                    <small>Bid: {currentPrice.toFixed(4)}</small>
                  </div>
                </button>
              </div>

              {/* Position Sizing Calculator Assistant */}
              <div className="ticket-calculator-card">
                <div className="calc-head">
                  <Calculator size={15} />
                  <span>Risk Assistant (Lots Calculator)</span>
                </div>

                <div className="calc-row">
                  <label>Risk Budget (%):</label>
                  <div className="input-with-affix">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="5"
                      value={riskPercent}
                      onChange={e => setRiskPercent(e.target.value)}
                    />
                    <span>% (${calculatedRiskBudget.toFixed(2)})</span>
                  </div>
                </div>

                <div className="calc-row">
                  <label>Stop Loss Price:</label>
                  <input
                    type="number"
                    step={instrument.pipSize === 0.01 ? "0.01" : "0.0001"}
                    placeholder={`e.g. ${(currentPrice - 0.0025).toFixed(4)}`}
                    value={slPrice}
                    onChange={e => setSlPrice(e.target.value)}
                  />
                </div>

                <div className="calc-row">
                  <label>Take Profit Price:</label>
                  <input
                    type="number"
                    step={instrument.pipSize === 0.01 ? "0.01" : "0.0001"}
                    placeholder={`e.g. ${(currentPrice + 0.0050).toFixed(4)}`}
                    value={tpPrice}
                    onChange={e => setTpPrice(e.target.value)}
                  />
                </div>

                {stopDistancePips > 0 && (
                  <div className="calc-suggestion">
                    <div>
                      <span>Stop: <strong>{stopDistancePips} pips</strong></span>
                      <span>Formula: <strong>{recommendedLots} L</strong></span>
                    </div>
                    <button onClick={autoApplyRecommendedLots} className="apply-lot-btn">
                      Apply {recommendedLots} Lots
                    </button>
                  </div>
                )}
              </div>

              {/* Lot size */}
              <div className="lot-input-group">
                <label>Allocated Size (Lots):</label>
                <div className="input-with-affix">
                  <input
                    type="number"
                    step="0.05"
                    min="0.01"
                    max="10"
                    value={lots}
                    onChange={e => setLots(e.target.value)}
                  />
                  <span>Standard Lots</span>
                </div>
              </div>

              {/* Plan-First Execution Action */}
              <button
                onClick={() => setShowJournalModal(true)}
                className={`execute-order-btn ${orderDirection.toLowerCase()}`}
              >
                <span>Journal Thesis & Execute {orderDirection}</span>
              </button>
            </div>
          </div>

          {/* Active Positions & Orders Table */}
          <div className="lab-bottom-tables">
            {/* Open Positions with Break-Even & Partial Close */}
            <div className="table-card">
              <div className="table-header">
                <h4>Open Simulated Positions ({openOrders.length})</h4>
              </div>
              {openOrders.length === 0 ? (
                <div className="empty-table-msg">
                  No open positions. Use the order ticket above to place a trade on historical replay.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="lab-table">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Type</th>
                        <th>Lots</th>
                        <th>Entry Price</th>
                        <th>SL / TP</th>
                        <th>Floating P&L</th>
                        <th>Defensive Actions</th>
                        <th>Close</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openOrders.map(order => {
                        const isJpy = order.symbol.includes("JPY");
                        const pipMultiplier = isJpy ? 100 : 10000;
                        const diff = order.type === "BUY" ? (currentPrice - order.openPrice) : (order.openPrice - currentPrice);
                        const pips = diff * pipMultiplier;
                        const pipVal = isJpy ? (1000 / currentPrice) : 10;
                        const orderPnl = pips * (order.lots * pipVal);

                        return (
                          <tr key={order.id}>
                            <td><strong>{order.symbol}</strong></td>
                            <td>
                              <span className={`dir-badge ${order.type.toLowerCase()}`}>
                                {order.type}
                              </span>
                            </td>
                            <td>{order.lots.toFixed(2)}L</td>
                            <td>{order.openPrice.toFixed(4)}</td>
                            <td>
                              <small>SL: {order.sl?.toFixed(4) || "None"}</small><br />
                              <small>TP: {order.tp?.toFixed(4) || "None"}</small>
                            </td>
                            <td style={{ color: orderPnl >= 0 ? "#82c91e" : "#fa5252", fontWeight: 700 }}>
                              {orderPnl >= 0 ? `+$${orderPnl.toFixed(2)}` : `-$${Math.abs(orderPnl).toFixed(2)}`}
                              <br /><small>({pips.toFixed(1)} pips)</small>
                            </td>
                            <td>
                              <div className="position-actions-cluster">
                                <button
                                  onClick={() => setBreakEvenSL(order.id)}
                                  className="btn-pos-action be"
                                  title="Move SL to Entry Price (Zero Risk)"
                                >
                                  🛡️ Break-Even
                                </button>
                                <button
                                  onClick={() => partialClose50(order.id)}
                                  className="btn-pos-action partial"
                                  title="Close 50% lots and bank profit"
                                >
                                  ✂️ Partial 50%
                                </button>
                              </div>
                            </td>
                            <td>
                              <button
                                onClick={() => closePosition(order.id)}
                                className="close-trade-btn"
                              >
                                Close All
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Closed Trades & Process Discipline Table */}
            <div className="table-card">
              <div className="table-header">
                <h4>Trade Journal & Process Discipline ({closedOrders.length})</h4>
              </div>
              {closedOrders.length === 0 ? (
                <div className="empty-table-msg">
                  Completed trades will appear here with automated process discipline grading.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="lab-table">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Type</th>
                        <th>Entry / Exit</th>
                        <th>Virtual P&L</th>
                        <th>Process Score</th>
                        <th>Debrief</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closedOrders.slice(0, 5).map(order => (
                        <tr key={order.id}>
                          <td><strong>{order.symbol}</strong></td>
                          <td>
                            <span className={`dir-badge ${order.type.toLowerCase()}`}>
                              {order.type} {order.lots}L
                            </span>
                          </td>
                          <td>
                            <small>{order.openPrice.toFixed(4)} → {order.closePrice?.toFixed(4)}</small>
                          </td>
                          <td style={{ color: order.pnl >= 0 ? "#82c91e" : "#fa5252", fontWeight: 700 }}>
                            {order.pnl >= 0 ? `+$${order.pnl.toFixed(2)}` : `-$${Math.abs(order.pnl).toFixed(2)}`}
                          </td>
                          <td>
                            <span className={`process-badge ${(order.processScore || 100) >= 80 ? "good" : "poor"}`}>
                              {(order.processScore || 100)} / 100
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedOrderForReview(order)}
                              className="review-btn"
                            >
                              <FileText size={14} /> Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB 2: GUIDED CHALLENGES */}
      {activeLabTab === "challenges" && (
        <div className="challenges-grid-layout">
          {SIMULATION_CHALLENGES.map(challenge => (
            <div key={challenge.id} className="challenge-card">
              <div className="challenge-card-top">
                <span className={`challenge-diff-pill ${challenge.difficulty.toLowerCase()}`}>
                  {challenge.difficulty}
                </span>
                <span className="challenge-target">Target: +{challenge.targetR}R</span>
              </div>

              <h3>{challenge.title}</h3>
              <p>{challenge.description}</p>

              <div className="challenge-condition-box">
                <Target size={15} />
                <span><strong>Win Condition:</strong> {challenge.winCondition}</span>
              </div>

              <div className="challenge-hint-box">
                <HelpCircle size={15} />
                <span><strong>Hint:</strong> {challenge.hint}</span>
              </div>

              <button
                onClick={() => {
                  setSelectedSymbol(challenge.recommendedInstrument);
                  setReplayIndex(challenge.initialIndex);
                  setActiveChallenge(challenge);
                  setActiveLabTab("terminal");
                  setOrderNotice(`Loaded Challenge: ${challenge.title}`);
                }}
                className="btn-launch-challenge"
              >
                Launch Challenge in Terminal <Play size={14} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PERFORMANCE & DISCIPLINE ANALYTICS */}
      {activeLabTab === "analytics" && (
        <div className="analytics-tab-layout">
          {/* Key Metric Tiles */}
          <div className="analytics-metrics-grid">
            <div className="metric-tile">
              <span>WIN RATE</span>
              <strong style={{ color: winRate >= 50 ? "#69db7c" : "#ffd43b" }}>{winRate}%</strong>
              <small>{winningTrades.length} Wins / {losingTrades.length} Losses</small>
            </div>

            <div className="metric-tile">
              <span>PROFIT FACTOR</span>
              <strong style={{ color: profitFactor >= 1.5 ? "#69db7c" : "#ffd43b" }}>
                {profitFactor}
              </strong>
              <small>Gross Profit ÷ Gross Loss</small>
            </div>

            <div className="metric-tile">
              <span>NET REALIZED P&L</span>
              <strong style={{ color: netVirtualPnl >= 0 ? "#69db7c" : "#ff8787" }}>
                {netVirtualPnl >= 0 ? `+$${netVirtualPnl.toFixed(2)}` : `-$${Math.abs(netVirtualPnl).toFixed(2)}`}
              </strong>
              <small>Across {totalTradesCount} Closed Trades</small>
            </div>

            <div className="metric-tile">
              <span>AVERAGE PROCESS GRADE</span>
              <strong style={{ color: avgProcessScore >= 80 ? "#69db7c" : "#ff8787" }}>
                {avgProcessScore >= 90 ? "A+" : avgProcessScore >= 80 ? "A" : avgProcessScore >= 70 ? "B" : "C"}
              </strong>
              <small>Discipline Index: {avgProcessScore}/100</small>
            </div>
          </div>

          <div className="analytics-insight-card">
            <ShieldCheck size={20} />
            <div>
              <h4>Process Quality Over Short-Term Outcome</h4>
              <p>
                In our Academy, we grade your long-term success by risk adherence (Stop Loss usage, 1% budget compliance, and trade journaling). A trader with a disciplined process and 40% win rate outlasts reckless traders over thousands of sample iterations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: PLAN-FIRST PRE-TRADE JOURNAL */}
      {showJournalModal && (
        <div className="modal-backdrop" onClick={() => setShowJournalModal(false)}>
          <div className="journal-modal" onClick={e => e.stopPropagation()}>
            <div className="journal-modal-head">
              <FileText size={20} />
              <h3>Plan-First Decision Journal</h3>
            </div>
            <p>
              In our Academy, every trade requires a stated rationale before submission. This trains disciplined decision-making and separates good process from emotional impulse.
            </p>

            <div className="modal-field">
              <label>What is your technical / market structure thesis?</label>
              <textarea
                rows={3}
                placeholder="e.g. Price pulled back to test previous resistance turned support at 1.0865 with a bullish pinbar candle."
                value={setupNote}
                onChange={e => setSetupNote(e.target.value)}
                autoFocus
              />
            </div>

            {/* Emotional Self-Checklist */}
            <div className="emotional-checklist-box">
              <span className="checklist-kicker">MANDATORY PRE-FLIGHT CHECKLIST</span>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={emotionalChecks.discipline}
                  onChange={e => setEmotionalChecks(c => ({ ...c, discipline: e.target.checked }))}
                />
                <span>I have placed an explicit Stop Loss to cap my maximum loss.</span>
              </label>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={emotionalChecks.noFomo}
                  onChange={e => setEmotionalChecks(c => ({ ...c, noFomo: e.target.checked }))}
                />
                <span>This setup satisfies my technical rules (Not an impulse FOMO entry).</span>
              </label>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={emotionalChecks.riskManaged}
                  onChange={e => setEmotionalChecks(c => ({ ...c, riskManaged: e.target.checked }))}
                />
                <span>Risk is strictly within my 1% to 2% account equity budget.</span>
              </label>
            </div>

            <div className="trade-summary-card">
              <div>
                <span>Order:</span> <strong>{orderDirection} {lots} Lots {selectedSymbol}</strong>
              </div>
              <div>
                <span>Entry:</span> <strong>{currentPrice.toFixed(4)}</strong>
              </div>
              <div>
                <span>Planned SL:</span> <strong>{slPrice ? Number(slPrice).toFixed(4) : "None (Violation!)"}</strong>
              </div>
              <div>
                <span>Planned Risk:</span> <strong>{riskPercent}% (${calculatedRiskBudget.toFixed(2)})</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowJournalModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={submitOrder} className="confirm-execute-btn">
                Confirm & Place Simulated Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: POST-TRADE REVIEW & DEBRIEF */}
      {selectedOrderForReview && (
        <div className="modal-backdrop" onClick={() => setSelectedOrderForReview(null)}>
          <div className="debrief-modal" onClick={e => e.stopPropagation()}>
            <div className="debrief-head">
              <Sparkles size={22} />
              <h3>Post-Trade Process Review</h3>
            </div>

            <div className="debrief-score-card">
              <div>
                <span>PROCESS DISCIPLINE SCORE</span>
                <strong>{selectedOrderForReview.processScore || 100} / 100</strong>
              </div>
              <div className="debrief-outcome-badge">
                {selectedOrderForReview.pnl >= 0 ? "Virtual Gain" : "Virtual Loss"}
              </div>
            </div>

            <div className="debrief-notes-box">
              <h4>Your Recorded Trade Thesis:</h4>
              <p>“{selectedOrderForReview.setupNote || "No journal note recorded."}”</p>
            </div>

            <div className="debrief-checklist">
              <div className="check-item">
                {selectedOrderForReview.sl ? (
                  <CheckCircle2 size={18} className="icon-pass" />
                ) : (
                  <XCircle size={18} className="icon-fail" />
                )}
                <span>
                  {selectedOrderForReview.sl ? "Protective Stop Loss was defined prior to execution." : "No Stop Loss used (High Risk violation)."}
                </span>
              </div>
              <div className="check-item">
                <CheckCircle2 size={18} className="icon-pass" />
                <span>
                  Trade outcome was probabilistic. Review execution quality rather than emotional hindsight.
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderForReview(null)}
              className="confirm-execute-btn"
              style={{ width: "100%", marginTop: "1rem" }}
            >
              Close Post-Trade Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
