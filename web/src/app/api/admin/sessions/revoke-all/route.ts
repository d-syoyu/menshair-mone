// src/app/api/admin/sessions/revoke-all/route.ts
// 「すべての端末からログアウト」：この管理者のログインの版を上げ、
// これまでに出たログイン（この端末のものも含む）をすべて使えなくする

import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sameOriginRequest } from "@/lib/login-guard";

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { error, user } = await checkAdminAuth();
  if (error) return error;
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { sessionVersion: { increment: 1 } },
  });
  return NextResponse.json({ success: true });
}
