import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { simOrders, users } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Please sign in to modify orders." }, { status: 401 });

    const body = await request.json();
    const orderId = String(body.orderId || "");
    const action = String(body.action || "UPDATE_SLTP"); // 'UPDATE_SLTP' | 'SET_BREAK_EVEN' | 'PARTIAL_CLOSE'
    const currentPrice = Number(body.currentPrice);

    const [order] = await db.select().from(simOrders)
      .where(and(eq(simOrders.id, orderId), eq(simOrders.userId, user.id)))
      .limit(1);

    if (!order || order.status !== "OPEN") {
      return NextResponse.json({ error: "Open position not found." }, { status: 404 });
    }

    if (action === "SET_BREAK_EVEN") {
      // Set SL to exact open price
      await db.update(simOrders).set({
        sl: order.openPrice,
        processScore: Math.min(100, (order.processScore || 100) + 10), // Reward risk defense
      }).where(eq(simOrders.id, orderId));

      return NextResponse.json({ ok: true, sl: order.openPrice, message: "Stop loss moved to Break-Even (Zero Risk)!" });
    }

    if (action === "PARTIAL_CLOSE" && currentPrice > 0) {
      const closeLotsPercent = Number(body.percent) || 50; // 50% default
      const lotsToClose = Math.round((order.lots * (closeLotsPercent / 100)) * 100) / 100;
      const remainingLots = Math.round((order.lots - lotsToClose) * 100) / 100;

      if (lotsToClose <= 0 || remainingLots < 0.01) {
        return NextResponse.json({ error: "Remaining lot size would be too small for partial close." }, { status: 400 });
      }

      // Calculate realized PnL on closed fraction
      const isJpy = order.symbol.includes("JPY");
      const pipMultiplier = isJpy ? 100 : 10000;
      const priceDiff = order.type === "BUY" ? (currentPrice - order.openPrice) : (order.openPrice - currentPrice);
      const pips = priceDiff * pipMultiplier;
      const pipVal = isJpy ? (1000 / currentPrice) : 10;
      const partialPnl = Math.round((pips * (lotsToClose * pipVal)) * 100) / 100;

      await db.transaction(async tx => {
        // Update position remaining lots
        await tx.update(simOrders).set({
          lots: remainingLots,
        }).where(eq(simOrders.id, orderId));

        // Update user virtual balance
        const [userData] = await tx.select().from(users).where(eq(users.id, user.id)).limit(1);
        const newBalance = Math.max(0, (userData?.virtualBalance ?? 10000) + partialPnl);

        await tx.update(users).set({
          virtualBalance: Math.round(newBalance * 100) / 100,
          lastActiveAt: new Date(),
        }).where(eq(users.id, user.id));
      });

      return NextResponse.json({
        ok: true,
        remainingLots,
        realizedPnl: partialPnl,
        message: `Closed ${lotsToClose} lots (${closeLotsPercent}%) and locked in ${partialPnl >= 0 ? '+$' + partialPnl : '-$' + Math.abs(partialPnl)}!`
      });
    }

    // Default UPDATE_SLTP
    const newSl = body.sl ? Number(body.sl) : null;
    const newTp = body.tp ? Number(body.tp) : null;

    await db.update(simOrders).set({
      sl: newSl,
      tp: newTp,
    }).where(eq(simOrders.id, orderId));

    return NextResponse.json({ ok: true, sl: newSl, tp: newTp, message: "Bracket order targets updated." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to modify position.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
