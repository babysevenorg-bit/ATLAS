import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ orders: [], balance: 10000 });
    const [orders, userData] = await Promise.all([
      db.simOrder.findMany({ where: { userId: user.id } }),
      db.user.findUnique({ where: { id: user.id }, select: { virtualBalance: true } }),
    ]);
    return NextResponse.json({
      orders,
      balance: userData?.virtualBalance ?? 10000,
    });
  } catch {
    return NextResponse.json({ orders: [], balance: 10000 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json(
        { error: "Please sign in to place virtual orders." },
        { status: 401 }
      );

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

    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { virtualBalance: true },
    });
    const currentBalance = userData?.virtualBalance ?? 10000;

    // Approximate margin requirement at 1:30 leverage
    const marginRequired = (lots * 100000) / 30;
    if (marginRequired > currentBalance) {
      return NextResponse.json(
        {
          error: `Insufficient virtual margin: Order requires $${marginRequired.toFixed(
            2
          )} margin, available balance is $${currentBalance.toFixed(
            2
          )}. Adjust lot size lower.`,
        },
        { status: 400 }
      );
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
      status: "OPEN" as const,
      pnl: 0,
      pips: 0,
      setupNote,
      riskPercentage,
      planFollowed: !!sl,
      processScore: sl ? (riskPercentage && riskPercentage <= 2.0 ? 100 : 80) : 50,
    };

    await db.simOrder.create({ data: newOrder });

    return NextResponse.json({ ok: true, order: newOrder });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to place order.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
