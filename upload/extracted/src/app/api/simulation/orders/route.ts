import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { simOrders, users } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ orders: [], balance: 10000 });
    const orders = await db.select().from(simOrders).where(eq(simOrders.userId, user.id));
    const [userData] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    return NextResponse.json({ orders, balance: userData?.virtualBalance ?? 10000 });
  } catch {
    return NextResponse.json({ orders: [], balance: 10000 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Please sign in to place virtual orders." }, { status: 401 });

    const body = await request.json();
    const symbol = String(body.symbol || "EUR/USD");
    const type = body.type === "SELL" ? "SELL" : "BUY";
    const orderType = body.orderType === "LIMIT" ? "LIMIT" : "MARKET";
    const lots = Math.max(0.01, Math.min(100, Number(body.lots) || 0.1));
    const openPrice = Number(body.openPrice);
    const sl = body.sl ? Number(body.sl) : null;
    const tp = body.tp ? Number(body.tp) : null;
    const setupNote = String(body.setupNote || "").slice(0, 500);
    const riskPercentage = body.riskPercentage ? Number(body.riskPercentage) : null;

    if (!openPrice || openPrice <= 0) {
      return NextResponse.json({ error: "Invalid execution price." }, { status: 400 });
    }

    // Check account balance and leverage requirements
    const [userData] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    const currentBalance = userData?.virtualBalance ?? 10000;

    // Approximate margin requirement at 1:30 leverage (1 standard lot = $100,000 / 30 = ~$3,333 margin)
    const marginRequired = (lots * 100000) / 30;
    if (marginRequired > currentBalance) {
      return NextResponse.json({
        error: `Insufficient virtual margin: Order requires $${marginRequired.toFixed(2)} margin, available balance is $${currentBalance.toFixed(2)}. Adjust lot size lower.`
      }, { status: 400 });
    }

    const orderId = randomUUID();
    const newOrder = {
      id: orderId,
      userId: user.id,
      symbol,
      type,
      orderType,
      lots,
      openPrice,
      sl,
      tp,
      status: "OPEN",
      pnl: 0,
      pips: 0,
      setupNote,
      riskPercentage,
      planFollowed: !!sl, // Has protective stop
      processScore: sl ? (riskPercentage && riskPercentage <= 2.0 ? 100 : 80) : 50, // Flag unhedged setups
    };

    await db.insert(simOrders).values(newOrder);

    return NextResponse.json({ ok: true, order: newOrder });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to place order.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
