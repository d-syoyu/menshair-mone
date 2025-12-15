// src/app/api/admin/coupons/route.ts
// MONË Salon - Coupons Admin API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";

// クーポン作成スキーマ
const createCouponSchema = z.object({
  code: z.string().min(1, "クーポンコードは必須です").max(50),
  name: z.string().min(1, "クーポン名は必須です"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().int().positive("割引値は正の整数である必要があります"),
  description: z.string().optional(),
  validFrom: z.string(), // ISO日付文字列
  validUntil: z.string(), // ISO日付文字列
  usageLimit: z.number().int().positive().optional().nullable(),
  usageLimitPerCustomer: z.number().int().positive().optional().nullable(),
  minimumAmount: z.number().int().nonnegative().optional().nullable(),
  isActive: z.boolean().default(true),
  applicableMenuIds: z.array(z.string()).optional(),
  applicableCategoryIds: z.array(z.string()).optional(),
  applicableWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "時間はHH:MM形式で入力してください").optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "時間はHH:MM形式で入力してください").optional().nullable(),
  onlyFirstTime: z.boolean().optional(),
  onlyReturning: z.boolean().optional(),
});

// GET /api/admin/coupons - クーポン一覧取得
export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const includeExpired = searchParams.get("includeExpired") === "true";

    const where: Record<string, unknown> = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (!includeExpired) {
      where.validUntil = {
        gte: new Date(),
      };
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      { error: "クーポン一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - クーポン作成
export async function POST(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const body = await request.json();
    const validationResult = createCouponSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // パーセンテージ割引の場合は100%以下をチェック
    if (data.type === "PERCENTAGE" && data.value > 100) {
      return NextResponse.json(
        { error: "パーセンテージ割引は100%以下である必要があります" },
        { status: 400 }
      );
    }

    // コードの重複チェック
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: "このクーポンコードは既に使用されています" },
        { status: 400 }
      );
    }

    // 有効期間チェック
    const validFrom = new Date(data.validFrom);
    const validUntil = new Date(data.validUntil);
    if (validFrom >= validUntil) {
      return NextResponse.json(
        { error: "終了日は開始日より後である必要があります" },
        { status: 400 }
      );
    }

    // 初回/リピーターの矛盾チェック
    if (data.onlyFirstTime && data.onlyReturning) {
      return NextResponse.json(
        { error: "初回限定とリピーター限定を同時に有効にはできません" },
        { status: 400 }
      );
    }

    // 時間帯チェック
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      return NextResponse.json(
        { error: "終了時間は開始時間より後である必要があります" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        type: data.type,
        value: data.value,
        description: data.description,
        validFrom,
        validUntil,
        usageLimit: data.usageLimit,
        usageLimitPerCustomer: data.usageLimitPerCustomer,
        minimumAmount: data.minimumAmount,
        isActive: data.isActive,
        applicableMenuIds: data.applicableMenuIds ?? [],
        applicableCategoryIds: data.applicableCategoryIds ?? [],
        applicableWeekdays: data.applicableWeekdays ?? [],
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        onlyFirstTime: data.onlyFirstTime ?? false,
        onlyReturning: data.onlyReturning ?? false,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json(
      { error: "クーポンの作成に失敗しました" },
      { status: 500 }
    );
  }
}
