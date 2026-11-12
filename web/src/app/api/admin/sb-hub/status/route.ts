// src/app/api/admin/sb-hub/status/route.ts
// 管理画面の「SB連携」欄：連携の状態と要確認の予約。画面を開いた時だけ呼ぶ（定期的に読み直さない、設計 5-4）。

import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSbShopStatus, sbHubEnabled } from "@/lib/sb-hub";
import { dbDateToJstDateString } from "@/lib/date-utils";
import { sameOriginRequest } from "@/lib/login-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;
  if (!sbHubEnabled()) return NextResponse.json({ enabled: false });

  const [status, review] = await Promise.all([
    getSbShopStatus(),
    prisma.reservation.findMany({
      where: { OR: [{ sbNeedsReview: true }, { sbRequested: true, status: "CONFIRMED" }] },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 50,
      select: {
        id: true, date: true, startTime: true, endTime: true, status: true, sbState: true,
        sbRequested: true, sbNeedsReview: true, user: { select: { name: true } },
      },
    }),
  ]);
  return NextResponse.json({
    enabled: true,
    status,
    review: review.map((r) => ({ ...r, date: dbDateToJstDateString(r.date), customerName: r.user?.name ?? null, user: undefined })),
  });
}

/** 要確認を確かめ終えた（SB上の予約を手で直した）。 */
export async function PATCH(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { error } = await checkAdminAuth();
  if (error) return error;
  const body = (await request.json().catch(() => null)) as { reservationId?: unknown } | null;
  if (typeof body?.reservationId !== "string") {
    return NextResponse.json({ error: "予約が指定されていません" }, { status: 400 });
  }
  const result = await prisma.reservation.updateMany({ where: { id: body.reservationId }, data: { sbNeedsReview: false } });
  if (result.count === 0) return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  return NextResponse.json({ success: true });
}
