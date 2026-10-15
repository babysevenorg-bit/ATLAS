import { NextResponse } from "next/server";
import { db } from "@/db";
import { getUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ ok: true, balance: 10000 });

    await db.$transaction(async (tx) => {
      await tx.simOrder.deleteMany({ where: { userId: user.id } });
      await tx.binarySim.deleteMany({ where: { userId: user.id } });
      await tx.user.update({
        where: { id: user.id },
        data: {
          virtualBalance: 10000.0,
          lastActiveAt: new Date(),
        },
      });
    });

    return NextResponse.json({ ok: true, balance: 10000 });
  } catch {
    return NextResponse.json(
      { error: "Failed to reset simulation account." },
      { status: 500 }
    );
  }
}
