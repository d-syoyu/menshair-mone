// src/app/api/admin/coupons/[id]/route.ts
// MONË Salon - Coupon Individual API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";

// クーポン更新スキーマ
const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  value: z.number().int().positive().optional(),
  description: z.string().nullable().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  usageLimitPerCustomer: z.number().int().positive().nullable().optional(),
  minimumAmount: z.number().int().nonnegative().nullable().optional(),
  isActive: z.boolean().optional(),
  applicableMenuIds: z.array(z.string()).optional(),
  applicableCategoryIds: z.array(z.string()).optional(),
  applicableWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "時間はHH:MM形式で入力してください").optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "時間はHH:MM形式で入力してください").optional().nullable(),
  onlyFirstTime: z.boolean().optional(),
  onlyReturning: z.boolean().optional(),
});

// GET /api/admin/coupons/[id] - クーポン詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        usages: {
          orderBy: { usedAt: "desc" },
          take: 50,
        },
        _count: {
          select: { usages: true, sales: true },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "クーポンが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Get coupon error:", error);
    return NextResponse.json(
      { error: "クーポンの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/coupons/[id] - クーポン更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const validationResult = updateCouponSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // クーポン存在チェック
    const existing = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "クーポンが見つかりません" },
        { status: 404 }
      );
    }

    // パーセンテージ割引の場合は100%以下をチェック
    const type = data.type || existing.type;
    const value = data.value || existing.value;
    if (type === "PERCENTAGE" && value > 100) {
      return NextResponse.json(
        { error: "パーセンテージ割引は100%以下である必要があります" },
        { status: 400 }
      );
    }

    // 初回/リピーターの矛盾チェック
    if ((data.onlyFirstTime ?? existing.onlyFirstTime) && (data.onlyReturning ?? existing.onlyReturning)) {
      return NextResponse.json(
        { error: "初回限定とリピーター限定を同時に有効にはできません" },
        { status: 400 }
      );
    }

    // コード変更時の重複チェック
    if (data.code && data.code.toUpperCase() !== existing.code) {
      const codeExists = await prisma.coupon.findUnique({
        where: { code: data.code.toUpperCase() },
      });
      if (codeExists) {
        return NextResponse.json(
          { error: "このクーポンコードは既に使用されています" },
          { status: 400 }
        );
      }
    }

    // 有効期間チェック
    const validFrom = data.validFrom ? new Date(data.validFrom) : existing.validFrom;
    const validUntil = data.validUntil ? new Date(data.validUntil) : existing.validUntil;
    if (validFrom >= validUntil) {
      return NextResponse.json(
        { error: "終了日は開始日より後である必要があります" },
        { status: 400 }
      );
    }

    if ((data.startTime ?? existing.startTime) && (data.endTime ?? existing.endTime)) {
      const start = data.startTime ?? existing.startTime!;
      const end = data.endTime ?? existing.endTime!;
      if (start >= end) {
        return NextResponse.json(
          { error: "終了時間は開始時間より後である必要があります" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.code) updateData.code = data.code.toUpperCase();
    if (data.validFrom) updateData.validFrom = validFrom;
    if (data.validUntil) updateData.validUntil = validUntil;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Update coupon error:", error);
    return NextResponse.json(
      { error: "クーポンの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/coupons/[id] - クーポン削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { id } = await params;

    // クーポン存在チェック
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "クーポンが見つかりません" },
        { status: 404 }
      );
    }

    // 売上で使用されている場合は警告（削除自体は許可）
    if (coupon._count.sales > 0) {
      // 論理削除（無効化）のみ
      await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "クーポンを無効化しました（売上履歴があるため完全削除はできません）"
      });
    }

    // 利用履歴も含めて削除（カスケード削除）
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ message: "クーポンを削除しました" });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.json(
      { error: "クーポンの削除に失敗しました" },
      { status: 500 }
    );
  }
}
