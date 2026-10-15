import { NextResponse } from "next/server";
import { db } from "@/db";
import { simOrders, binarySims, users } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ ok: true, balance: 10000 });

    await db.transaction(async tx => {
      await tx.delete(simOrders).where(eq(simOrders.userId, user.id));
      await tx.delete(binarySims).where(eq(binarySims.userId, user.id));
      await tx.update(users).set({
        virtualBalance: 10000.0,
        lastActiveAt: new Date(),
      }).where(eq(users.id, user.id));
    });

    return NextResponse.json({ ok: true, balance: 10000 });
  } catch {
    return NextResponse.json({ error: "Failed to reset simulation account." }, { status: 500 });
  }
}
