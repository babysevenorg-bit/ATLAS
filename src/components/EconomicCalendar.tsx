"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  Info,
  Loader2,
  Zap,
  Flame,
  CircleDot,
  CalendarDays,
  Globe2,
} from "lucide-react";

type EconomicEvent = {
  id: string;
  time: string;
  country: string;
  countryCode: string;
  currency: string;
  impact: "high" | "medium" | "low";
  title: string;
  forecast: string;
  previous: string;
  actual: string | null;
  category:
    | "Interest Rate"
    | "Inflation"
    | "Employment"
    | "GDP"
    | "Trade"
    | "Sentiment"
    | "Speech";
  description: string;
};

type DateRange =
  | "today"
  | "tomorrow"
  | "this-week"
  | "next-week"
  | "this-month";

type ImpactFilter = "all" | "high" | "medium+";

const DATE_RANGE_OPTIONS: { id: DateRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "this-week", label: "This Week" },
  { id: "next-week", label: "Next Week" },
  { id: "this-month", label: "This Month" },
];

const IMPACT_OPTIONS: { id: ImpactFilter; label: string }[] = [
  { id: "all", label: "All Impacts" },
  { id: "high", label: "High Only" },
  { id: "medium+", label: "Medium+" },
];

const COUNTRY_OPTIONS: { code: string; flag: string; label: string }[] = [
  { code: "US", flag: "🇺🇸", label: "USD" },
  { code: "EU", flag: "🇪🇺", label: "EUR" },
  { code: "UK", flag: "🇬🇧", label: "GBP" },
  { code: "JP", flag: "🇯🇵", label: "JPY" },
  { code: "AU", flag: "🇦🇺", label: "AUD" },
  { code: "CA", flag: "🇨🇦", label: "CAD" },
  { code: "CH", flag: "🇨🇭", label: "CHF" },
  { code: "NZ", flag: "🇳🇿", label: "NZD" },
];

/**
 * Compute the [start, end] window (in ISO strings) for the given range.
 * All anchored in UTC.
 */
function computeWindow(
  range: DateRange,
  now: Date
): { start: Date; end: Date } {
  const startOfDayUTC = (d: Date) =>
    new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
    );
  // Day-of-week helper: 0=Sun..6=Sat
  const dayOfWeek = (d: Date) => d.getUTCDay();

  const today = startOfDayUTC(now);

  switch (range) {
    case "today":
      return { start: today, end: new Date(today.getTime() + 24 * 3600_000) };
    case "tomorrow":
      return {
        start: new Date(today.getTime() + 24 * 3600_000),
        end: new Date(today.getTime() + 48 * 3600_000),
      };
    case "this-week": {
      // Week = Monday..Sunday UTC
      const dow = (dayOfWeek(today) + 6) % 7; // 0=Mon..6=Sun
      const weekStart = new Date(today.getTime() - dow * 24 * 3600_000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 3600_000);
      return { start: weekStart, end: weekEnd };
    }
    case "next-week": {
      const dow = (dayOfWeek(today) + 6) % 7;
      const thisWeekStart = new Date(today.getTime() - dow * 24 * 3600_000);
      const nextWeekStart = new Date(
        thisWeekStart.getTime() + 7 * 24 * 3600_000
      );
      const nextWeekEnd = new Date(
        nextWeekStart.getTime() + 7 * 24 * 3600_000
      );
      return { start: nextWeekStart, end: nextWeekEnd };
    }
    case "this-month": {
      const monthStart = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
      );
      const monthEnd = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1)
      );
      return { start: monthStart, end: monthEnd };
    }
  }
}

function formatTimeUTC(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDateUTC(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const day = d.getUTCDate();
  return `${month} ${day}`;
}

function formatRelativeHours(iso: string, now: number): string {
  const diffMs = new Date(iso).getTime() - now;
  if (diffMs <= 0) return "now";
  const hours = Math.floor(diffMs / 3600_000);
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
}

const IMPACT_META: Record<
  EconomicEvent["impact"],
  { label: string; color: string; icon: React.ComponentType<{ size?: number }> }
> = {
  high: { label: "High", color: "#ff6b6b", icon: Flame },
  medium: { label: "Medium", color: "#ffd43b", icon: Zap },
  low: { label: "Low", color: "#7c8b86", icon: CircleDot },
};

const CATEGORY_ICON: Record<EconomicEvent["category"], string> = {
  "Interest Rate": "%",
  Inflation: "📊",
  Employment: "👥",
  GDP: "📈",
  Trade: "🚢",
  Sentiment: "💬",
  Speech: "🎙",
};

export default function EconomicCalendar() {
  const [range, setRange] = useState<DateRange>("this-week");
  const [impact, setImpact] = useState<ImpactFilter>("all");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // Tick "now" every 60s so the relative-time stats stay fresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const toggleCountry = useCallback((code: string) => {
    setSelectedCountries(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  }, []);

  // Fetch events whenever filters change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = new URL("/api/economic-calendar", window.location.origin);
    // Use a generous default window (30 days) — client filters by selected range.
    url.searchParams.set("days", "30");
    if (impact === "high") url.searchParams.set("impact", "high");
    else if (impact === "medium+") url.searchParams.set("impact", "medium+");
    if (selectedCountries.length > 0)
      url.searchParams.set("country", selectedCountries.join(","));

    fetch(url.toString(), { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setEvents([]);
        } else if (Array.isArray(data.events)) {
          setEvents(data.events);
        } else {
          setEvents([]);
        }
      })
      .catch(err => {
        if (cancelled) return;
        setError(err?.message || "Failed to load calendar.");
        setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [impact, selectedCountries]);

  // Apply the client-side date-range filter (today/tomorrow/week/month)
  const window = useMemo(() => computeWindow(range, new Date(now)), [
    range,
    now,
  ]);
  const visibleEvents = useMemo(() => {
    const startMs = window.start.getTime();
    const endMs = window.end.getTime();
    return events
      .filter(ev => {
        const t = new Date(ev.time).getTime();
        return t >= startMs && t < endMs;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [events, window]);

  // Stats
  const stats = useMemo(() => {
    const weekStart = (() => {
      const d = new Date(now);
      const dow = (d.getUTCDay() + 6) % 7;
      const t = new Date(
        Date.UTC(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          d.getUTCDate() - dow,
          0,
          0,
          0,
          0
        )
      );
      return t.getTime();
    })();
    const weekEnd = weekStart + 7 * 24 * 3600_000;

    const highImpactThisWeek = events.filter(ev => {
      const t = new Date(ev.time).getTime();
      return (
        ev.impact === "high" && t >= weekStart && t < weekEnd
      );
    }).length;

    const nextMajor = visibleEvents.find(ev => ev.impact === "high");
    // If no high-impact event visible, fall back to any upcoming event in the next 30d
    const nextMajorGlobal = nextMajor
      ? nextMajor
      : events.find(ev => ev.impact === "high");

    const highImpactVisible = visibleEvents.filter(
      ev => ev.impact === "high"
    ).length;
    const mediumImpactVisible = visibleEvents.filter(
      ev => ev.impact === "medium"
    ).length;
    const lowImpactVisible = visibleEvents.filter(
      ev => ev.impact === "low"
    ).length;

    return {
      highImpactThisWeek,
      nextMajorHoursAway: nextMajorGlobal
        ? formatRelativeHours(nextMajorGlobal.time, now)
        : null,
      nextMajor: nextMajorGlobal,
      highImpactVisible,
      mediumImpactVisible,
      lowImpactVisible,
    };
  }, [events, visibleEvents, now]);

  const today = new Date(now);

  return (
    <div className="ec-container">
      {/* Hero */}
      <div className="ec-hero">
        <div className="ec-hero-left">
          <div className="kicker-badge">
            <CalendarClock size={15} /> ECONOMIC CALENDAR · FR-023
          </div>
          <h1>
            Upcoming market-moving events<span className="title-dot">.</span>
          </h1>
          <p>
            Central bank decisions, inflation prints, employment data, GDP and
            trade figures — scheduled releases that historically move forex
            markets. Plan ahead to avoid holding leveraged positions through
            volatile prints.
          </p>
        </div>
        <div className="ec-hero-right">
          <div className="ec-stats-card">
            <div className="ec-stats-row">
              <div className="ec-stat">
                <span className="ec-stat-label">High impact this week</span>
                <span className="ec-stat-value ec-stat-high">
                  {stats.highImpactThisWeek}
                </span>
              </div>
              <div className="ec-stat">
                <span className="ec-stat-label">Next major event</span>
                <span className="ec-stat-value ec-stat-next">
                  {stats.nextMajorHoursAway || "—"}
                </span>
                <span className="ec-stat-sub">
                  {stats.nextMajor ? stats.nextMajor.title : "none scheduled"}
                </span>
              </div>
            </div>
            <div className="ec-stats-meta">
              <Globe2 size={12} />
              All times in <strong>UTC</strong> · Updated{" "}
              {today.toLocaleTimeString("en-GB", { hour12: false })}
            </div>
          </div>
        </div>
      </div>

      {/* Educational disclaimer */}
      <div className="ec-disclaimer">
        <AlertTriangle size={18} />
        <div>
          <strong>Educational note.</strong> Economic events can cause
          significant volatility and spread widening. This calendar is for
          educational awareness only — <em>not trading signals</em>. Never hold
          leveraged positions through major prints without a defined risk plan.
        </div>
      </div>

      {/* Filters */}
      <div className="ec-filters">
        <div className="ec-filter-group">
          <Filter size={13} />
          <span className="ec-filter-label">Date</span>
          <div className="ec-pills">
            {DATE_RANGE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`ec-pill ${range === opt.id ? "active" : ""}`}
                onClick={() => setRange(opt.id)}
              >
                <CalendarDays size={12} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ec-filter-group">
          <Filter size={13} />
          <span className="ec-filter-label">Impact</span>
          <div className="ec-pills">
            {IMPACT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`ec-pill ${impact === opt.id ? "active" : ""}`}
                onClick={() => setImpact(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ec-filter-group ec-filter-group-countries">
          <Filter size={13} />
          <span className="ec-filter-label">Currency</span>
          <div className="ec-pills ec-pills-countries">
            {COUNTRY_OPTIONS.map(opt => (
              <button
                key={opt.code}
                className={`ec-pill ec-pill-country ${
                  selectedCountries.includes(opt.code) ? "active" : ""
                }`}
                onClick={() => toggleCountry(opt.code)}
                title={opt.code}
              >
                <span className="ec-pill-flag">{opt.flag}</span>
                {opt.label}
              </button>
            ))}
            {selectedCountries.length > 0 && (
              <button
                className="ec-pill ec-pill-clear"
                onClick={() => setSelectedCountries([])}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary line */}
      <div className="ec-summary">
        <span>
          <strong>{visibleEvents.length}</strong> events ·{" "}
          <span className="ec-badge-mini ec-badge-high">
            {stats.highImpactVisible} high
          </span>{" "}
          <span className="ec-badge-mini ec-badge-medium">
            {stats.mediumImpactVisible} medium
          </span>{" "}
          <span className="ec-badge-mini ec-badge-low">
            {stats.lowImpactVisible} low
          </span>
        </span>
        <span className="ec-summary-window">
          {window.start.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            timeZone: "UTC",
          })}{" "}
          →{" "}
          {new Date(window.end.getTime() - 1).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            timeZone: "UTC",
          })}{" "}
          UTC
        </span>
      </div>

      {/* Table */}
      <div className="ec-table-wrap">
        {loading ? (
          <EconomicCalendarSkeleton />
        ) : error ? (
          <div className="ec-empty">
            <AlertTriangle size={28} />
            <h3>Couldn&apos;t load events</h3>
            <p>{error}</p>
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="ec-empty">
            <Info size={28} />
            <h3>No events match your filters</h3>
            <p>
              Try widening the date range, switching to &quot;All Impacts&quot;,
              or clearing the currency filter.
            </p>
          </div>
        ) : (
          <table className="ec-table">
            <thead>
              <tr>
                <th className="ec-th-time">Time (UTC)</th>
                <th className="ec-th-country">Country</th>
                <th className="ec-th-impact">Impact</th>
                <th className="ec-th-title">Event</th>
                <th className="ec-th-forecast">Forecast</th>
                <th className="ec-th-previous">Previous</th>
                <th className="ec-th-actual">Actual</th>
                <th className="ec-th-toggle" />
              </tr>
            </thead>
            <tbody>
              {visibleEvents.map(ev => {
                const meta = IMPACT_META[ev.impact];
                const Icon = meta.icon;
                const isExpanded = expandedId === ev.id;
                const isNewDay = false; // grouping handled visually via row class
                return (
                  <React.Fragment key={ev.id}>
                    <tr
                      className={`ec-row ec-row-${ev.impact} ${
                        isExpanded ? "expanded" : ""
                      } ${isNewDay ? "ec-row-newday" : ""}`}
                      onClick={() =>
                        setExpandedId(prev => (prev === ev.id ? null : ev.id))
                      }
                    >
                      <td className="ec-td-time">
                        <div className="ec-time-cell">
                          <span className="ec-time-hm">
                            {formatTimeUTC(ev.time)}
                          </span>
                          <span className="ec-time-day">
                            {formatDateUTC(ev.time)}
                          </span>
                        </div>
                      </td>
                      <td className="ec-td-country">
                        <span className="ec-flag">{ev.countryCode}</span>
                        <span className="ec-country-code">{ev.country}</span>
                        <span className="ec-currency">{ev.currency}</span>
                      </td>
                      <td className="ec-td-impact">
                        <span
                          className="ec-impact-badge"
                          style={{
                            background: meta.color,
                          }}
                        >
                          <Icon size={10} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="ec-td-title">
                        <span className="ec-cat-icon">
                          {CATEGORY_ICON[ev.category]}
                        </span>
                        <span className="ec-title">{ev.title}</span>
                      </td>
                      <td className="ec-td-forecast ec-num">
                        {ev.forecast}
                      </td>
                      <td className="ec-td-previous ec-num">
                        {ev.previous}
                      </td>
                      <td className="ec-td-actual ec-num">
                        {ev.actual ? (
                          <span className="ec-actual-value">{ev.actual}</span>
                        ) : (
                          <span className="ec-actual-pending">pending</span>
                        )}
                      </td>
                      <td className="ec-td-toggle">
                        {isExpanded ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="ec-row ec-row-detail">
                        <td colSpan={8}>
                          <div className="ec-detail">
                            <div className="ec-detail-meta">
                              <span className="ec-detail-cat">
                                {ev.category}
                              </span>
                              <span className="ec-detail-pair">
                                <Clock size={11} />
                                {new Date(ev.time).toUTCString()}
                              </span>
                            </div>
                            <p className="ec-detail-desc">{ev.description}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="ec-footnote">
        <Info size={12} />
        Event times and forecasts are deterministic educational simulations
        seeded from the current UTC date — refreshed daily. Real-time economic
        calendars (ForexFactory, Investing.com, DailyFX) require API keys and
        are not integrated here.
      </div>
    </div>
  );
}

function EconomicCalendarSkeleton() {
  return (
    <div className="ec-skeleton">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="ec-skeleton-row">
          <div className="ec-sk ec-sk-time" />
          <div className="ec-sk ec-sk-country" />
          <div className="ec-sk ec-sk-impact" />
          <div className="ec-sk ec-sk-title" />
          <div className="ec-sk ec-sk-num" />
          <div className="ec-sk ec-sk-num" />
          <div className="ec-sk ec-sk-num" />
          <div className="ec-sk ec-sk-toggle" />
        </div>
      ))}
      <div className="ec-skeleton-loading">
        <Loader2 size={14} className="ec-spinner" />
        Loading economic events…
      </div>
    </div>
  );
}
