import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { simOrders, users } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Please sign in to close positions." }, { status: 401 });

    const body = await request.json();
    const orderId = String(body.orderId || "");
    const closePrice = Number(body.closePrice);
    const closeReason = String(body.closeReason || "MANUAL");

    if (!orderId || !closePrice || closePrice <= 0) {
      return NextResponse.json({ error: "Invalid close order parameters." }, { status: 400 });
    }

    const [order] = await db.select().from(simOrders)
      .where(and(eq(simOrders.id, orderId), eq(simOrders.userId, user.id)))
      .limit(1);

    if (!order || order.status !== "OPEN") {
      return NextResponse.json({ error: "Position not found or already closed." }, { status: 404 });
    }

    // Calculate pip difference & PnL
    const isJpy = order.symbol.includes("JPY");
    const pipMultiplier = isJpy ? 100 : 10000;
    const priceDiff = order.type === "BUY" ? (closePrice - order.openPrice) : (order.openPrice - closePrice);
    const pips = priceDiff * pipMultiplier;

    // Approximate pip value: standard lot on EUR/USD = $10/pip
    const pipValuePerStandardLot = isJpy ? (1000 / closePrice) : 10;
    const pnl = pips * (order.lots * pipValuePerStandardLot);

    // Calculate process score:
    // Process quality assesses:
    // 1. Did the trade have an explicit Stop Loss? (+30 pts)
    // 2. Was risk within 2%? (+30 pts)
    // 3. Did it respect SL/TP without emotional panic exit? (+40 pts)
    let processScore = 100;
    if (!order.sl) processScore -= 40;
    if (order.riskPercentage && order.riskPercentage > 2.5) processScore -= 25;

    await db.transaction(async tx => {
      await tx.update(simOrders).set({
        closePrice,
        closeTime: new Date(),
        closeReason,
        status: "CLOSED",
        pnl: Math.round(pnl * 100) / 100,
        pips: Math.round(pips * 10) / 10,
        processScore,
      }).where(eq(simOrders.id, orderId));

      const [userData] = await tx.select().from(users).where(eq(users.id, user.id)).limit(1);
      const newBalance = Math.max(0, (userData?.virtualBalance ?? 10000) + pnl);

      await tx.update(users).set({
        virtualBalance: Math.round(newBalance * 100) / 100,
        lastActiveAt: new Date(),
      }).where(eq(users.id, user.id));
    });

    return NextResponse.json({
      ok: true,
      pnl: Math.round(pnl * 100) / 100,
      pips: Math.round(pips * 10) / 10,
      processScore,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to close position.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
