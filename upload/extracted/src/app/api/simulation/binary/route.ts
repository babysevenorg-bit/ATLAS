import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { binarySims, users } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const body = await request.json();
    const asset = String(body.asset || "EUR/USD (OTC Binary Sim)");
    const direction = body.direction === "PUT" ? "PUT" : "CALL";
    const stake = Math.max(10, Math.min(1000, Number(body.stake) || 50));
    const strikePrice = Number(body.strikePrice);
    const expiryPrice = Number(body.expiryPrice);
    const expirySeconds = Number(body.expirySeconds) || 60;
    const payoutPercent = Number(body.payoutPercent) || 80.0;

    if (!strikePrice || !expiryPrice) {
      return NextResponse.json({ error: "Invalid price points." }, { status: 400 });
    }

    let outcome: "WIN" | "LOSS" | "TIE" = "TIE";
    if (direction === "CALL") {
      if (expiryPrice > strikePrice) outcome = "WIN";
      else if (expiryPrice < strikePrice) outcome = "LOSS";
    } else {
      if (expiryPrice < strikePrice) outcome = "WIN";
      else if (expiryPrice > strikePrice) outcome = "LOSS";
    }

    let returnAmount = 0;
    let netPnl = -stake;

    if (outcome === "WIN") {
      const profit = (stake * payoutPercent) / 100;
      returnAmount = stake + profit;
      netPnl = profit;
    } else if (outcome === "TIE") {
      returnAmount = stake;
      netPnl = 0;
    }

    // Expected value calculation under 50/50 fair probability assumption:
    // EV = (0.5 * (stake * payout/100)) + (0.5 * -stake)
    const expectedValue = (0.5 * ((stake * payoutPercent) / 100)) - (0.5 * stake);

    if (user) {
      const simId = randomUUID();
      await db.transaction(async tx => {
        await tx.insert(binarySims).values({
          id: simId,
          userId: user.id,
          asset,
          direction,
          stake,
          strikePrice,
          expiryPrice,
          expirySeconds,
          payoutPercent,
          outcome,
          returnAmount,
          netPnl: Math.round(netPnl * 100) / 100,
          expectedValue: Math.round(expectedValue * 100) / 100,
        });

        const [userData] = await tx.select().from(users).where(eq(users.id, user.id)).limit(1);
        const newBalance = Math.max(0, (userData?.virtualBalance ?? 10000) + netPnl);

        await tx.update(users).set({
          virtualBalance: Math.round(newBalance * 100) / 100,
          lastActiveAt: new Date(),
        }).where(eq(users.id, user.id));
      });
    }

    return NextResponse.json({
      outcome,
      returnAmount,
      netPnl: Math.round(netPnl * 100) / 100,
      expectedValue: Math.round(expectedValue * 100) / 100,
      breakEvenWinRate: Math.round((stake / (stake + (stake * payoutPercent / 100))) * 10000) / 100, // e.g. 55.56%
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to simulate binary contract.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
