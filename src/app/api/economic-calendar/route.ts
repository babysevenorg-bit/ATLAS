import { NextRequest, NextResponse } from "next/server";
import { getEconomicEvents, type EconomicEvent } from "@/lib/economicEvents";

export const dynamic = "force-dynamic";

const VALID_COUNTRIES = new Set([
  "US",
  "EU",
  "UK",
  "JP",
  "AU",
  "CA",
  "CH",
  "NZ",
]);

type ImpactFilter = "high" | "medium+" | "all";

/**
 * GET /api/economic-calendar
 *
 * Query params:
 *  - days     (number, default 7, max 30)  — number of days forward to include
 *  - impact   (string, default "all")      — "high" | "medium+" | "all"
 *  - country  (string, repeatable)         — comma-separated list, e.g. "US,EU,UK"
 *
 * Returns: { events: EconomicEvent[], generatedAt: string, rangeStart: string, rangeEnd: string }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse days
    const daysParam = Number(searchParams.get("days") ?? "7");
    const days = Number.isFinite(daysParam)
      ? Math.max(1, Math.min(30, Math.round(daysParam)))
      : 7;

    // Parse impact filter
    const impactRaw = (searchParams.get("impact") ?? "all")
      .toLowerCase()
      .replace(/\s+/g, "");
    let impactFilter: ImpactFilter = "all";
    if (impactRaw === "high") impactFilter = "high";
    else if (impactRaw === "medium+" || impactRaw === "mediumplus")
      impactFilter = "medium+";

    // Parse country filter (comma-separated, case-insensitive)
    const countryParam = searchParams.get("country") ?? "";
    const countries = countryParam
      .split(",")
      .map(c => c.trim().toUpperCase())
      .filter(c => c.length > 0 && VALID_COUNTRIES.has(c));

    // Generate events from "now"
    const from = new Date();
    const allEvents = getEconomicEvents(from);

    // Date window
    const rangeStart = from.getTime();
    const rangeEnd = rangeStart + days * 24 * 60 * 60 * 1000;

    const filtered: EconomicEvent[] = allEvents.filter(ev => {
      const t = new Date(ev.time).getTime();
      if (t < rangeStart || t > rangeEnd) return false;

      // Impact filter
      if (impactFilter === "high" && ev.impact !== "high") return false;
      if (
        impactFilter === "medium+" &&
        ev.impact !== "high" &&
        ev.impact !== "medium"
      )
        return false;

      // Country filter
      if (countries.length > 0 && !countries.includes(ev.country)) return false;

      return true;
    });

    return NextResponse.json({
      events: filtered,
      generatedAt: from.toISOString(),
      rangeStart: new Date(rangeStart).toISOString(),
      rangeEnd: new Date(rangeEnd).toISOString(),
      count: filtered.length,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Economic calendar unavailable.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
