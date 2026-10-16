/**
 * Economic Calendar — seeded educational event generator (FR-023)
 *
 * Free economic calendar APIs require API keys and have CORS issues, so we
 * generate deterministic, realistic educational events for the next 30 days
 * based on the current date (day-level seed). The same day always produces
 * the same event list; tomorrow produces a different one.
 *
 * All datetimes are UTC ISO strings — currency markets trade 24/5 across zones
 * and UTC is the canonical calendar reference.
 */

export type EconomicEvent = {
  id: string;
  time: string; // ISO datetime string (UTC)
  country: string; // 'US' | 'EU' | 'UK' | 'JP' | 'AU' | 'CA' | 'CH' | 'NZ'
  countryCode: string; // flag emoji
  currency: string; // 'USD' | 'EUR' | 'GBP' | ...
  impact: "high" | "medium" | "low";
  title: string;
  forecast: string;
  previous: string;
  actual: string | null; // null until event occurs
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

type CountryCode = "US" | "EU" | "UK" | "JP" | "AU" | "CA" | "CH" | "NZ";
type Impact = "high" | "medium" | "low";

const COUNTRY_META: Record<
  CountryCode,
  { name: string; flag: string; currency: string }
> = {
  US: { name: "United States", flag: "🇺🇸", currency: "USD" },
  EU: { name: "Eurozone", flag: "🇪🇺", currency: "EUR" },
  UK: { name: "United Kingdom", flag: "🇬🇧", currency: "GBP" },
  JP: { name: "Japan", flag: "🇯🇵", currency: "JPY" },
  AU: { name: "Australia", flag: "🇦🇺", currency: "AUD" },
  CA: { name: "Canada", flag: "🇨🇦", currency: "CAD" },
  CH: { name: "Switzerland", flag: "🇨🇭", currency: "CHF" },
  NZ: { name: "New Zealand", flag: "🇳🇿", currency: "NZD" },
};

/* -------------------------------------------------------------------------- */
/* Deterministic PRNG (mulberry32) + day-level seed                            */
/* -------------------------------------------------------------------------- */

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daySeedFromDate(d: Date): number {
  return (
    d.getUTCFullYear() * 10000 +
    (d.getUTCMonth() + 1) * 100 +
    d.getUTCDate()
  );
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* -------------------------------------------------------------------------- */
/* Date scheduling helpers — all in UTC                                        */
/* -------------------------------------------------------------------------- */

/** Find the Nth weekday (0=Sun..6=Sat) of a given year/month. */
function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number
): Date | null {
  const d = new Date(Date.UTC(year, month, 1));
  let count = 0;
  while (d.getUTCMonth() === month) {
    if (d.getUTCDay() === weekday) {
      count++;
      if (count === n) return new Date(d);
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return null;
}

/** First Friday of the month (NFP release day). */
function firstFridayOfMonth(year: number, month: number): Date | null {
  return nthWeekdayOfMonth(year, month, 5, 1);
}

/** Find next N occurrences of the first Friday of each month (>= from). */
function nextFirstFridays(from: Date, count: number): Date[] {
  const out: Date[] = [];
  let y = from.getUTCFullYear();
  let m = from.getUTCMonth();
  let safety = 0;
  while (out.length < count && safety < 36) {
    const friday = firstFridayOfMonth(y, m);
    if (friday) {
      friday.setUTCHours(12, 30, 0, 0);
      if (friday.getTime() >= from.getTime()) out.push(friday);
    }
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
    safety++;
  }
  return out;
}

/** Find next N occurrences of the Nth weekday of each month (>= from). */
function nextNthWeekday(
  from: Date,
  weekday: number,
  n: number,
  count: number
): Date[] {
  const out: Date[] = [];
  let y = from.getUTCFullYear();
  let m = from.getUTCMonth();
  let safety = 0;
  while (out.length < count && safety < 36) {
    const d = nthWeekdayOfMonth(y, m, weekday, n);
    if (d) {
      if (d.getTime() >= from.getTime()) out.push(d);
    }
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
    safety++;
  }
  return out;
}

/** Find next N Thursdays (for weekly releases like US Jobless Claims). */
function nextThursdays(from: Date, count: number): Date[] {
  const out: Date[] = [];
  const d = new Date(from);
  d.setUTCHours(12, 30, 0, 0);
  // advance to next Thursday
  while (d.getUTCDay() !== 4) d.setUTCDate(d.getUTCDate() + 1);
  // if same day but already past, advance a week
  if (d.getTime() < from.getTime()) d.setUTCDate(d.getUTCDate() + 7);
  for (let i = 0; i < count; i++) {
    out.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
}

/** Find a mid-month Tuesday (around the 13th-15th) — typical CPI release. */
function nextMidMonthDays(from: Date, count: number): Date[] {
  const out: Date[] = [];
  let y = from.getUTCFullYear();
  let m = from.getUTCMonth();
  let safety = 0;
  while (out.length < count && safety < 36) {
    // 13th of the month
    const d = new Date(Date.UTC(y, m, 13, 12, 30, 0, 0));
    if (d.getTime() >= from.getTime()) out.push(d);
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
    safety++;
  }
  return out;
}

/** Last business day of the month (end-of-month data dumps). */
function nextLastBusinessDays(from: Date, count: number): Date[] {
  const out: Date[] = [];
  let y = from.getUTCFullYear();
  let m = from.getUTCMonth();
  let safety = 0;
  while (out.length < count && safety < 36) {
    // last day of month
    const d = new Date(Date.UTC(y, m + 1, 0, 9, 0, 0, 0));
    // back up to last weekday
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
      d.setUTCDate(d.getUTCDate() - 1);
    }
    if (d.getTime() >= from.getTime()) out.push(d);
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
    safety++;
  }
  return out;
}

/** First business day of the month (PMIs). */
function nextFirstBusinessDays(from: Date, count: number): Date[] {
  const out: Date[] = [];
  let y = from.getUTCFullYear();
  let m = from.getUTCMonth();
  let safety = 0;
  while (out.length < count && safety < 36) {
    const d = new Date(Date.UTC(y, m, 1, 8, 30, 0, 0));
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
      d.setUTCDate(d.getUTCDate() + 1);
    }
    if (d.getTime() >= from.getTime()) out.push(d);
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
    safety++;
  }
  return out;
}

/** Pick N deterministic weekday-only offsets in [1..range] using PRNG. */
function deterministicWeekdayOffsets(
  rng: () => number,
  range: number,
  count: number
): number[] {
  const picks = new Set<number>();
  let safety = 0;
  while (picks.size < count && safety < range * 4) {
    const v = 1 + Math.floor(rng() * range);
    picks.add(v);
    safety++;
  }
  return Array.from(picks).sort((a, b) => a - b);
}

/* -------------------------------------------------------------------------- */
/* Value generators (forecast / previous)                                     */
/* -------------------------------------------------------------------------- */

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}
function fmtRate(n: number): string {
  return `${n.toFixed(2)}%`;
}
function fmtK(n: number): string {
  return `${n}K`;
}

/* -------------------------------------------------------------------------- */
/* Event templates                                                            */
/* -------------------------------------------------------------------------- */

type EventTemplate = {
  idPrefix: string;
  title: string;
  country: CountryCode;
  impact: Impact;
  category: EconomicEvent["category"];
  description: string;
  schedule: (from: Date) => Array<{ date: Date }>;
  values: (rng: () => number) => { forecast: string; previous: string };
};

const TEMPLATES: EventTemplate[] = [
  /* ---------- HIGH IMPACT — INTEREST RATES ---------- */
  {
    idPrefix: "fomc-rate",
    title: "FOMC Interest Rate Decision",
    country: "US",
    impact: "high",
    category: "Interest Rate",
    description:
      "The Federal Open Market Committee sets the target range for the federal funds rate — the cost of overnight USD lending. A rate hike (or hawkish tone) typically strengthens the USD by widening yield differentials; a cut (or dovish pivot) weakens it. EUR/USD, USD/JPY and gold usually see the largest moves. Markets also parse the post-decision press conference for forward guidance.",
    schedule: from => nextNthWeekday(from, 3, 3, 1).map(date => ({ date })),
    values: rng => {
      const base = 5.25 + (rng() - 0.5) * 0.5;
      return { forecast: fmtRate(base), previous: fmtRate(base) };
    },
  },
  {
    idPrefix: "ecb-rate",
    title: "ECB Interest Rate Decision",
    country: "EU",
    impact: "high",
    category: "Interest Rate",
    description:
      "The European Central Bank sets the refi rate for the Eurozone. Higher rates attract capital inflows into EUR-denominated assets, typically strengthening the EUR. Watch for the press conference ~45 minutes after the decision for the policy tone. EUR/USD is the most directly affected pair.",
    schedule: from => nextNthWeekday(from, 4, 1, 1).map(date => ({ date })),
    values: rng => {
      const base = 4.0 + (rng() - 0.5) * 0.75;
      return { forecast: fmtRate(base), previous: fmtRate(base) };
    },
  },
  {
    idPrefix: "boe-rate",
    title: "BoE Interest Rate Decision",
    country: "UK",
    impact: "high",
    category: "Interest Rate",
    description:
      "The Bank of England's Monetary Policy Committee sets the Bank Rate. Hawkish surprises lift GBP (especially GBP/USD and EUR/GBP); dovish surprises weaken it. The vote split and accompanying statement are scrutinised for future path signals.",
    schedule: from => nextNthWeekday(from, 4, 2, 1).map(date => ({ date })),
    values: rng => {
      const base = 5.0 + (rng() - 0.5) * 0.5;
      return { forecast: fmtRate(base), previous: fmtRate(base) };
    },
  },
  {
    idPrefix: "boj-rate",
    title: "BoJ Interest Rate Decision",
    country: "JP",
    impact: "high",
    category: "Interest Rate",
    description:
      "The Bank of Japan is the last major central bank holding ultra-loose policy. Even hints of a shift away from yield curve control can cause violent USD/JPY repricing. Watch the policy statement and governor press conference closely — JPY pairs often gap on surprise wording.",
    schedule: from => nextNthWeekday(from, 5, 2, 1).map(date => ({ date })),
    values: rng => {
      const base = 0.1 + rng() * 0.4;
      return { forecast: fmtRate(base), previous: fmtRate(base) };
    },
  },
  {
    idPrefix: "rba-rate",
    title: "RBA Interest Rate Decision",
    country: "AU",
    impact: "high",
    category: "Interest Rate",
    description:
      "The Reserve Bank of Australia sets the cash rate target. AUD crosses (AUD/USD, AUD/JPY) typically react within seconds of the release. A hawkish hold can be just as bullish as a hike; a dovish hold just as bearish as a cut.",
    schedule: from => nextNthWeekday(from, 2, 1, 1).map(date => ({ date })),
    values: rng => {
      const base = 4.1 + (rng() - 0.5) * 0.5;
      return { forecast: fmtRate(base), previous: fmtRate(base) };
    },
  },
  {
    idPrefix: "boc-rate",
    title: "BoC Interest Rate Decision",
    country: "CA",
    impact: "high",
    category: "Interest Rate",
    description:
      "The Bank of Canada sets the overnight rate target. USD/CAD is the most sensitive pair. Canadian rate decisions often move in lockstep with the Fed — divergence is the key driver for sustained USD/CAD trends.",
    schedule: from => nextNthWeekday(from, 3, 2, 1).map(date => ({ date })),
    values: rng => {
      const base = 4.5 + (rng() - 0.5) * 0.5;
      return { forecast: fmtRate(base), previous: fmtRate(base) };
    },
  },
  {
    idPrefix: "snb-rate",
    title: "SNB Interest Rate Decision",
    country: "CH",
    impact: "high",
    category: "Interest Rate",
    description:
      "The Swiss National Bank sets the policy rate. SNB is known for surprising markets (e.g. the 2015 franc unpegging). USD/CHF and EUR/CHF can move sharply — sometimes accompanied by intervention rhetoric.",
    schedule: from => nextNthWeekday(from, 4, 3, 1).map(date => ({ date })),
    values: rng => {
      const base = 1.25 + (rng() - 0.5) * 0.5;
      return { forecast: fmtRate(base), previous: fmtRate(base) };
    },
  },
  {
    idPrefix: "rbnz-rate",
    title: "RBNZ Interest Rate Decision",
    country: "NZ",
    impact: "high",
    category: "Interest Rate",
    description:
      "The Reserve Bank of New Zealand sets the official cash rate. NZD/USD and NZD/JPY are the most reactive. The RBNZ is often one of the first central banks to pivot, so its decisions are watched as a global risk-appetite signal.",
    schedule: from => nextNthWeekday(from, 3, 4, 1).map(date => ({ date })),
    values: rng => {
      const base = 5.25 + (rng() - 0.5) * 0.5;
      return { forecast: fmtRate(base), previous: fmtRate(base) };
    },
  },

  /* ---------- HIGH IMPACT — EMPLOYMENT ---------- */
  {
    idPrefix: "nfp",
    title: "Non-Farm Payrolls (NFP)",
    country: "US",
    impact: "high",
    category: "Employment",
    description:
      "The granddaddy of forex volatility — NFP measures the monthly change in US ex-farm employment. Released the first Friday of each month at 12:30 UTC. A beat strengthens USD (and usually sends EUR/USD down, USD/JPY up); a miss weakens it. Spreads widen dramatically in the seconds before release — never hold a leveraged position through it without a defined plan. Also watch the unemployment rate and average hourly earnings released alongside.",
    schedule: from => nextFirstFridays(from, 2).map(date => ({ date })),
    values: rng => {
      const forecast = Math.floor(140 + rng() * 180);
      const previous = Math.floor(120 + rng() * 200);
      return { forecast: fmtK(forecast), previous: fmtK(previous) };
    },
  },
  {
    idPrefix: "us-unemployment",
    title: "US Unemployment Rate",
    country: "US",
    impact: "high",
    category: "Employment",
    description:
      "Released alongside NFP on the first Friday of each month. A falling unemployment rate is USD-positive (signals Fed tightening potential); a rising rate is USD-negative. The Fed's dual mandate makes this print as important as NFP itself.",
    schedule: from => nextFirstFridays(from, 2).map(date => ({ date })),
    values: rng => {
      const forecast = (3.6 + rng() * 0.8).toFixed(1);
      const previous = (3.7 + rng() * 0.7).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "ca-employment",
    title: "Canada Employment Change",
    country: "CA",
    impact: "high",
    category: "Employment",
    description:
      "Monthly Canadian net new jobs. Strong print lifts CAD; weak print weakens it. USD/CAD is the primary reactor. Released the same week as US NFP — sometimes the same Friday — which can create correlated volatility.",
    schedule: from => nextFirstFridays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = Math.floor(10 + rng() * 50);
      const previous = Math.floor(-5 + rng() * 60);
      return { forecast: fmtK(forecast), previous: fmtK(previous) };
    },
  },
  {
    idPrefix: "au-employment",
    title: "Australia Employment Change",
    country: "AU",
    impact: "high",
    category: "Employment",
    description:
      "Monthly Australian net new jobs. Released by the ABS. AUD/USD is the primary reactor. Watch the unemployment rate and participation rate alongside the headline — the RBA weighs all three.",
    schedule: from => nextNthWeekday(from, 4, 2, 1).map(date => ({ date })),
    values: rng => {
      const forecast = Math.floor(15 + rng() * 45);
      const previous = Math.floor(10 + rng() * 50);
      return { forecast: fmtK(forecast), previous: fmtK(previous) };
    },
  },

  /* ---------- HIGH IMPACT — INFLATION ---------- */
  {
    idPrefix: "us-cpi",
    title: "US CPI (YoY)",
    country: "US",
    impact: "high",
    category: "Inflation",
    description:
      "Consumer Price Index year-over-year. Higher-than-expected CPI typically strengthens the USD as it raises the odds of Fed rate hikes; lower CPI weakens the dollar. Released mid-month at 12:30 UTC. Core CPI (ex-food & energy) is the more market-moving figure — watch both. EUR/USD and USD/JPY often move 50-100 pips on the print.",
    schedule: from => nextMidMonthDays(from, 2).map(date => ({ date })),
    values: rng => {
      const forecast = (2.8 + rng() * 1.8).toFixed(1);
      const previous = (2.9 + rng() * 1.7).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "eu-cpi",
    title: "Eurozone CPI Flash Estimate (YoY)",
    country: "EU",
    impact: "high",
    category: "Inflation",
    description:
      "The flash CPI print is the ECB's preferred inflation gauge and a direct input to rate decisions. Higher CPI supports EUR; lower CPI weakens it. EUR/USD is the most reactive pair. Released at the end of each month.",
    schedule: from => nextLastBusinessDays(from, 2).map(date => ({ date })),
    values: rng => {
      const forecast = (2.2 + rng() * 1.8).toFixed(1);
      const previous = (2.3 + rng() * 1.7).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "uk-cpi",
    title: "UK CPI (YoY)",
    country: "UK",
    impact: "high",
    category: "Inflation",
    description:
      "UK consumer price inflation. Higher-than-expected CPI supports GBP via tighter BoE policy expectations; lower CPI weakens it. GBP/USD and EUR/GBP are the primary reactors. Released mid-month.",
    schedule: from => nextMidMonthDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (2.5 + rng() * 2.0).toFixed(1);
      const previous = (2.6 + rng() * 1.9).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "jp-cpi",
    title: "Japan CPI (YoY)",
    country: "JP",
    impact: "high",
    category: "Inflation",
    description:
      "Tokyo-area CPI is released first (end of month), followed by the nationwide print a month later. Sustained inflation above 2% would pressure the BoJ to exit ultra-loose policy — USD/JPY is hypersensitive to upside surprises.",
    schedule: from => nextLastBusinessDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (2.0 + rng() * 1.5).toFixed(1);
      const previous = (2.1 + rng() * 1.4).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "ca-cpi",
    title: "Canada CPI (YoY)",
    country: "CA",
    impact: "high",
    category: "Inflation",
    description:
      "Canadian consumer price inflation. Released mid-month. A higher print lifts CAD by increasing BoC rate-hike odds; a lower print weakens CAD. USD/CAD is the primary reactor — often the loonie's biggest single-day driver.",
    schedule: from => nextMidMonthDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (2.4 + rng() * 1.5).toFixed(1);
      const previous = (2.5 + rng() * 1.4).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "us-pce",
    title: "US Core PCE Price Index (YoY)",
    country: "US",
    impact: "high",
    category: "Inflation",
    description:
      "The Fed's preferred inflation gauge (core PCE, ex-food & energy). Higher-than-expected PCE pressures the Fed toward tightening — USD-positive, gold-negative. Released at the end of each month with personal income/spending. Sometimes the single most important data point in a month.",
    schedule: from => nextLastBusinessDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (2.5 + rng() * 1.0).toFixed(1);
      const previous = (2.6 + rng() * 0.9).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },

  /* ---------- HIGH IMPACT — GDP ---------- */
  {
    idPrefix: "us-gdp",
    title: "US GDP Growth Rate (QoQ Annualized)",
    country: "US",
    impact: "high",
    category: "GDP",
    description:
      "Quarterly annualized GDP growth. Released in three versions (advance, second, final) over ~2 months. Strong growth supports USD by raising rate-hike odds; weak growth weakens the dollar. The advance release is the most market-moving. Released at 12:30 UTC.",
    schedule: from => nextNthWeekday(from, 3, 4, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (1.8 + rng() * 1.8).toFixed(1);
      const previous = (2.0 + rng() * 1.5).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "eu-gdp",
    title: "Eurozone GDP Growth Rate (QoQ)",
    country: "EU",
    impact: "high",
    category: "GDP",
    description:
      "Eurozone quarterly GDP. Released in flash and final versions. Strong growth supports EUR; weak growth (especially contraction) pressures the ECB toward easing. EUR/USD is the primary reactor.",
    schedule: from => nextNthWeekday(from, 2, 2, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (0.1 + rng() * 0.5).toFixed(1);
      const previous = (0.0 + rng() * 0.6).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "uk-gdp",
    title: "UK GDP Growth Rate (MoM)",
    country: "UK",
    impact: "medium",
    category: "GDP",
    description:
      "UK monthly GDP estimate. Released mid-month with the prior month's data. Negative prints often pressure GBP via BoE-easing speculation; positive prints support the pound.",
    schedule: from => nextMidMonthDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (0.0 + rng() * 0.4 - 0.1).toFixed(2);
      const previous = (0.0 + rng() * 0.4).toFixed(2);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },

  /* ---------- MEDIUM IMPACT — SENTIMENT / PMIs ---------- */
  {
    idPrefix: "us-ism-mfg",
    title: "ISM Manufacturing PMI",
    country: "US",
    impact: "medium",
    category: "Sentiment",
    description:
      "ISM Manufacturing Purchasing Managers' Index — a diffusion reading above 50 signals expansion, below 50 signals contraction. A strong print is USD-positive; weak print is USD-negative. Released the first business day of each month at 14:00 UTC.",
    schedule: from =>
      nextFirstBusinessDays(from, 1).map(date => {
        date.setUTCHours(14, 0, 0, 0);
        return { date };
      }),
    values: rng => {
      const forecast = (47 + rng() * 6).toFixed(1);
      const previous = (48 + rng() * 5).toFixed(1);
      return { forecast, previous };
    },
  },
  {
    idPrefix: "us-ism-services",
    title: "ISM Services PMI",
    country: "US",
    impact: "medium",
    category: "Sentiment",
    description:
      "ISM Services PMI — covers the much larger services sector. Released the third business day of each month. More impactful than manufacturing PMI for USD given services' weight in the US economy.",
    schedule: from =>
      nextNthWeekday(from, 2, 1, 1).map(date => {
        date.setUTCHours(14, 0, 0, 0);
        return { date };
      }),
    values: rng => {
      const forecast = (50 + rng() * 5).toFixed(1);
      const previous = (51 + rng() * 4).toFixed(1);
      return { forecast, previous };
    },
  },
  {
    idPrefix: "eu-mfg-pmi",
    title: "Eurozone Manufacturing PMI (Final)",
    country: "EU",
    impact: "medium",
    category: "Sentiment",
    description:
      "Final manufacturing PMI for the Eurozone. Released first business day of each month — usually confirms the flash estimate. EUR/USD moves on revisions away from the flash print.",
    schedule: from =>
      nextFirstBusinessDays(from, 1).map(date => {
        date.setUTCHours(8, 0, 0, 0);
        return { date };
      }),
    values: rng => {
      const forecast = (46 + rng() * 6).toFixed(1);
      const previous = (47 + rng() * 5).toFixed(1);
      return { forecast, previous };
    },
  },
  {
    idPrefix: "uk-mfg-pmi",
    title: "UK Manufacturing PMI",
    country: "UK",
    impact: "medium",
    category: "Sentiment",
    description:
      "UK manufacturing PMI — diffusion index above/below 50. Released first business day of each month. Modest impact on GBP unless the print diverges sharply from expectations.",
    schedule: from =>
      nextFirstBusinessDays(from, 1).map(date => {
        date.setUTCHours(8, 30, 0, 0);
        return { date };
      }),
    values: rng => {
      const forecast = (47 + rng() * 5).toFixed(1);
      const previous = (48 + rng() * 4).toFixed(1);
      return { forecast, previous };
    },
  },
  {
    idPrefix: "us-consumer-confidence",
    title: "US Consumer Confidence (CB)",
    country: "US",
    impact: "medium",
    category: "Sentiment",
    description:
      "Conference Board consumer confidence index. Released the last Tuesday of each month at 14:00 UTC. Strong consumer confidence supports USD via consumption-driven growth expectations.",
    schedule: from =>
      nextNthWeekday(from, 2, 4, 1).map(date => {
        date.setUTCHours(14, 0, 0, 0);
        return { date };
      }),
    values: rng => {
      const forecast = Math.floor(100 + rng() * 15);
      const previous = Math.floor(102 + rng() * 12);
      return { forecast: `${forecast}`, previous: `${previous}` };
    },
  },

  /* ---------- MEDIUM IMPACT — EMPLOYMENT (weekly) ---------- */
  {
    idPrefix: "us-jobless-claims",
    title: "US Initial Jobless Claims",
    country: "US",
    impact: "medium",
    category: "Employment",
    description:
      "Weekly count of new unemployment benefit filings. Released every Thursday at 12:30 UTC. A high-impact recurring print — sharp increases signal labor market cooling (USD-negative); declines signal strength (USD-positive). Often the only meaningful weekly data point.",
    schedule: from => nextThursdays(from, 4).map(date => ({ date })),
    values: rng => {
      const forecast = Math.floor(210 + rng() * 60);
      const previous = Math.floor(215 + rng() * 50);
      return { forecast: fmtK(forecast), previous: fmtK(previous) };
    },
  },

  /* ---------- MEDIUM IMPACT — TRADE / RETAIL ---------- */
  {
    idPrefix: "us-retail-sales",
    title: "US Retail Sales (MoM)",
    country: "US",
    impact: "medium",
    category: "Trade",
    description:
      "Monthly change in US retail sales. Released mid-month at 12:30 UTC. Strong retail sales support USD via consumption-driven GDP growth. 'Control group' retail sales (ex-auto, ex-gas, ex-food services) is the most market-moving subcomponent.",
    schedule: from => nextMidMonthDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (0.0 + rng() * 0.8 - 0.1).toFixed(2);
      const previous = (0.0 + rng() * 0.7).toFixed(2);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "uk-retail-sales",
    title: "UK Retail Sales (MoM)",
    country: "UK",
    impact: "medium",
    category: "Trade",
    description:
      "UK monthly retail sales. Released mid-month. A leading consumption indicator — strong print supports GBP. Often volatile due to weather and seasonal adjustments.",
    schedule: from => nextMidMonthDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (0.0 + rng() * 0.6 - 0.1).toFixed(2);
      const previous = (0.0 + rng() * 0.5).toFixed(2);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "us-trade-balance",
    title: "US Trade Balance",
    country: "US",
    impact: "medium",
    category: "Trade",
    description:
      "Monthly US trade deficit. Released mid-month. A widening deficit is structurally USD-negative (more USD sold to pay for imports); a narrowing deficit is USD-positive. Long-term factor for fundamental traders.",
    schedule: from => nextMidMonthDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (-(60 + rng() * 15)).toFixed(1);
      const previous = (-(62 + rng() * 13)).toFixed(1);
      return { forecast: `$${forecast}B`, previous: `$${previous}B` };
    },
  },
  {
    idPrefix: "ca-trade-balance",
    title: "Canada Trade Balance",
    country: "CA",
    impact: "medium",
    category: "Trade",
    description:
      "Monthly Canadian trade balance. Released the same week as US trade data. Surpluses support CAD; deficits weaken it. Watch crude oil exports — Canada's largest export category and a major USD/CAD driver.",
    schedule: from => nextMidMonthDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (0.5 + rng() * 1.5).toFixed(1);
      const previous = (0.3 + rng() * 1.8).toFixed(1);
      return { forecast: `$${forecast}B`, previous: `$${previous}B` };
    },
  },
  {
    idPrefix: "au-trade-balance",
    title: "Australia Trade Balance",
    country: "AU",
    impact: "medium",
    category: "Trade",
    description:
      "Monthly Australian trade balance. Surpluses support AUD; deficits weaken it. Iron ore exports dominate — the price of iron ore is a leading indicator for this print.",
    schedule: from => nextNthWeekday(from, 4, 1, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (4 + rng() * 4).toFixed(1);
      const previous = (5 + rng() * 3).toFixed(1);
      return { forecast: `$${forecast}B`, previous: `$${previous}B` };
    },
  },
  {
    idPrefix: "jp-trade-balance",
    title: "Japan Trade Balance",
    country: "JP",
    impact: "medium",
    category: "Trade",
    description:
      "Monthly Japanese trade balance. Structural deficits (energy imports) have pressured JPY in recent years. Widening deficit is JPY-negative; narrowing or surplus is JPY-positive.",
    schedule: from => nextMidMonthDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (-(0.5 + rng() * 1.5)).toFixed(2);
      const previous = (-(0.7 + rng() * 1.3)).toFixed(2);
      return { forecast: `¥${forecast}T`, previous: `¥${previous}T` };
    },
  },

  /* ---------- LOW/MEDIUM — INFLATION SUB-INDICATORS ---------- */
  {
    idPrefix: "us-ppi",
    title: "US Producer Price Index (YoY)",
    country: "US",
    impact: "medium",
    category: "Inflation",
    description:
      "Producer Price Index — wholesale inflation that feeds through to consumer prices with a lag. Released the week before CPI. Higher PPI often prefigures higher CPI, so it's a leading indicator for the Fed's preferred inflation gauge.",
    schedule: from => nextMidMonthDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (1.5 + rng() * 2.0).toFixed(1);
      const previous = (1.6 + rng() * 1.9).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "eu-ppi",
    title: "Eurozone PPI (YoY)",
    country: "EU",
    impact: "low",
    category: "Inflation",
    description:
      "Eurozone producer prices. Released monthly with a lag. Lower market impact than CPI but a useful leading indicator. Persistent PPI deflation signals future CPI weakness — EUR-negative.",
    schedule: from => nextNthWeekday(from, 3, 1, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (-(4 + rng() * 6)).toFixed(1);
      const previous = (-(5 + rng() * 5)).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },

  /* ---------- MEDIUM IMPACT — SPEECHES (deterministic, scattered) ---------- */
  {
    idPrefix: "fed-speech",
    title: "Fed Chair Speech",
    country: "US",
    impact: "medium",
    category: "Speech",
    description:
      "Scheduled remarks by the Federal Reserve Chair. Markets parse every word for forward-guidance signals. Even prepared remarks can move USD 30-50 pips if they hint at the policy path. Q&A sessions are especially volatile — the Chair often improvises.",
    schedule: from => {
      const rng = mulberry32(daySeedFromDate(from) + 7777);
      const offsets = deterministicWeekdayOffsets(rng, 25, 2);
      return offsets.map(o => {
        const d = new Date(from);
        d.setUTCDate(d.getUTCDate() + o);
        d.setUTCHours(14, 0, 0, 0);
        return { date: d };
      });
    },
    values: rng => ({ forecast: "—", previous: "—" }),
  },
  {
    idPrefix: "ecb-speech",
    title: "ECB President Speech",
    country: "EU",
    impact: "medium",
    category: "Speech",
    description:
      "Scheduled remarks by the ECB President. Often at the European Parliament or major conferences. Markets listen for shifts in inflation outlook language. EUR/USD is the primary reactor.",
    schedule: from => {
      const rng = mulberry32(daySeedFromDate(from) + 8888);
      const offsets = deterministicWeekdayOffsets(rng, 25, 2);
      return offsets.map(o => {
        const d = new Date(from);
        d.setUTCDate(d.getUTCDate() + o);
        d.setUTCHours(9, 0, 0, 0);
        return { date: d };
      });
    },
    values: rng => ({ forecast: "—", previous: "—" }),
  },
  {
    idPrefix: "boe-speech",
    title: "BoE Governor Speech",
    country: "UK",
    impact: "medium",
    category: "Speech",
    description:
      "Scheduled remarks by the BoE Governor. Released throughout the year at various forums. Watch for tone shifts — the Governor often signals upcoming policy moves weeks in advance.",
    schedule: from => {
      const rng = mulberry32(daySeedFromDate(from) + 9999);
      const offsets = deterministicWeekdayOffsets(rng, 25, 1);
      return offsets.map(o => {
        const d = new Date(from);
        d.setUTCDate(d.getUTCDate() + o);
        d.setUTCHours(11, 0, 0, 0);
        return { date: d };
      });
    },
    values: rng => ({ forecast: "—", previous: "—" }),
  },
  {
    idPrefix: "boj-speech",
    title: "BoJ Governor Speech",
    country: "JP",
    impact: "medium",
    category: "Speech",
    description:
      "Remarks by the BoJ Governor. Given the BoJ's outlier policy stance, even subtle changes in yield-curve-control language can move USD/JPY 50-100 pips. Speeches at the Diet (parliament) are typically the most consequential.",
    schedule: from => {
      const rng = mulberry32(daySeedFromDate(from) + 11111);
      const offsets = deterministicWeekdayOffsets(rng, 25, 1);
      return offsets.map(o => {
        const d = new Date(from);
        d.setUTCDate(d.getUTCDate() + o);
        d.setUTCHours(3, 0, 0, 0); // 12:00 JST
        return { date: d };
      });
    },
    values: rng => ({ forecast: "—", previous: "—" }),
  },

  /* ---------- LOW IMPACT — MISC ---------- */
  {
    idPrefix: "us-building-permits",
    title: "US Building Permits",
    country: "US",
    impact: "low",
    category: "Sentiment",
    description:
      "Monthly US building permits — a leading indicator for construction activity. Released with housing starts mid-month. Low direct forex impact but a useful input for broader growth forecasts.",
    schedule: from => nextMidMonthDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (1.4 + rng() * 0.3).toFixed(2);
      const previous = (1.42 + rng() * 0.28).toFixed(2);
      return { forecast: `${forecast}M`, previous: `${previous}M` };
    },
  },
  {
    idPrefix: "nz-trade-balance",
    title: "NZ Trade Balance (MoM)",
    country: "NZ",
    impact: "low",
    category: "Trade",
    description:
      "Monthly NZ trade balance. Released with a lag. Dairy exports dominate — Fonterra's GDT auction results often pre-figure this print. Low volatility but a useful fundamental input for NZD/USD traders.",
    schedule: from => nextNthWeekday(from, 2, 3, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (-(200 + rng() * 400)).toFixed(0);
      const previous = (-(250 + rng() * 350)).toFixed(0);
      return { forecast: `NZ$${forecast}M`, previous: `NZ$${previous}M` };
    },
  },
  {
    idPrefix: "au-cpi",
    title: "Australia CPI (YoY)",
    country: "AU",
    impact: "medium",
    category: "Inflation",
    description:
      "Australian quarterly CPI. AUD/USD is the primary reactor. A higher-than-expected print lifts the RBA rate-hike odds and supports AUD; a miss weakens it. Note: Australia moved to monthly CPI indicators in 2022 — quarterly prints remain the headline.",
    schedule: from => nextNthWeekday(from, 3, 4, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (3.0 + rng() * 1.5).toFixed(1);
      const previous = (3.1 + rng() * 1.4).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "ch-cpi",
    title: "Switzerland CPI (YoY)",
    country: "CH",
    impact: "medium",
    category: "Inflation",
    description:
      "Swiss CPI — released monthly. Lower inflation than the Eurozone is structurally CHF-supportive due to safe-haven flows. Higher-than-expected CPI pressures the SNB toward tightening, supporting CHF.",
    schedule: from => nextNthWeekday(from, 2, 1, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (1.0 + rng() * 1.0).toFixed(1);
      const previous = (1.1 + rng() * 0.9).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "eu-unemployment",
    title: "Eurozone Unemployment Rate",
    country: "EU",
    impact: "medium",
    category: "Employment",
    description:
      "Eurozone unemployment rate. Released at the end of each month with a lag. Falling unemployment supports EUR via stronger growth/rate-hike expectations; rising unemployment pressures the ECB toward easing.",
    schedule: from => nextLastBusinessDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (6.2 + rng() * 0.8).toFixed(1);
      const previous = (6.3 + rng() * 0.7).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
  {
    idPrefix: "uk-unemployment",
    title: "UK Unemployment Rate (3M)",
    country: "UK",
    impact: "medium",
    category: "Employment",
    description:
      "UK 3-month rolling unemployment rate. Released mid-month. Watch average weekly earnings (the bonus/ex-bonus split) — strong wage growth is the BoE's primary inflation concern and a GBP catalyst.",
    schedule: from => nextMidMonthDays(from, 1).map(date => ({ date })),
    values: rng => {
      const forecast = (4.0 + rng() * 0.5).toFixed(1);
      const previous = (4.1 + rng() * 0.4).toFixed(1);
      return { forecast: `${forecast}%`, previous: `${previous}%` };
    },
  },
];

/* -------------------------------------------------------------------------- */
/* Main generator                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Generate deterministic economic events for the next 30 days.
 * Same `from` date (UTC day) always produces the same event list.
 */
export function getEconomicEvents(from: Date = new Date()): EconomicEvent[] {
  const now = new Date();
  const events: EconomicEvent[] = [];

  for (const tpl of TEMPLATES) {
    const occurrences = tpl.schedule(from);
    for (const { date } of occurrences) {
      // Skip events more than 30 days out
      const dayDiff = Math.floor(
        (date.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (dayDiff > 30) continue;

      // Deterministic RNG seeded by (date, template)
      const seed =
        daySeedFromDate(date) ^ hashString(tpl.idPrefix) ^ 0x5bd1e995;
      const rng = mulberry32(seed);
      const { forecast, previous } = tpl.values(rng);

      // Generate actual value for past events
      let actual: string | null = null;
      if (date.getTime() < now.getTime()) {
        // Use a slightly different seed to vary the actual vs forecast
        const actualRng = mulberry32(seed ^ 0xa5a5a5a5);
        const vals = tpl.values(actualRng);
        actual = vals.forecast;
      }

      const meta = COUNTRY_META[tpl.country];
      events.push({
        id: `${tpl.idPrefix}-${date.toISOString().slice(0, 10)}`,
        time: date.toISOString(),
        country: tpl.country,
        countryCode: meta.flag,
        currency: meta.currency,
        impact: tpl.impact,
        title: tpl.title,
        forecast,
        previous,
        actual,
        category: tpl.category,
        description: tpl.description,
      });
    }
  }

  // Sort chronologically
  events.sort((a, b) => a.time.localeCompare(b.time));
  return events;
}

/** Convenience: list supported countries for filter UIs. */
export function getSupportedCountries(): Array<{
  code: CountryCode;
  name: string;
  flag: string;
  currency: string;
}> {
  return (Object.keys(COUNTRY_META) as CountryCode[]).map(code => ({
    code,
    name: COUNTRY_META[code].name,
    flag: COUNTRY_META[code].flag,
    currency: COUNTRY_META[code].currency,
  }));
}
