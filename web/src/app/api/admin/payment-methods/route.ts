// src/app/api/admin/payment-methods/route.ts
// MONË Salon - Payment Method Settings API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";

// 支払方法更新スキーマ
const updatePaymentMethodSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1, "表示名は必須です"),
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0),
});

const updatePaymentMethodsSchema = z.array(updatePaymentMethodSchema);

// 支払方法作成スキーマ（任意のコードを許可）
const createPaymentMethodSchema = z.object({
  code: z.string()
    .min(1, "コードは必須です")
    .max(50, "コードは50文字以内で入力してください")
    .regex(/^[A-Z0-9_]+$/, "コードは大文字英数字とアンダースコアのみ使用できます"),
  displayName: z.string().min(1, "表示名は必須です"),
});

// 支払方法削除スキーマ
const deletePaymentMethodSchema = z.object({
  id: z.string(),
});

// GET /api/admin/payment-methods - 支払方法一覧取得
export async function GET() {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const paymentMethods = await prisma.paymentMethodSetting.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({
      paymentMethods,
    });
  } catch (error) {
    console.error("Get payment methods error:", error);
    return NextResponse.json(
      { error: "支払方法の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/payment-methods - 支払方法一括更新
export async function PUT(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const body = await request.json();
    const validationResult = updatePaymentMethodsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // トランザクションで一括更新
    await prisma.$transaction(
      updates.map((pm) =>
        prisma.paymentMethodSetting.update({
          where: { id: pm.id },
          data: {
            displayName: pm.displayName,
            isActive: pm.isActive,
            displayOrder: pm.displayOrder,
          },
        })
      )
    );

    // 更新後のデータを取得
    const paymentMethods = await prisma.paymentMethodSetting.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({
      paymentMethods,
    });
  } catch (error) {
    console.error("Update payment methods error:", error);
    return NextResponse.json(
      { error: "支払方法の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/admin/payment-methods - 支払方法追加
export async function POST(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const body = await request.json();
    const validationResult = createPaymentMethodSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { code, displayName } = validationResult.data;

    // 既存チェック
    const existing = await prisma.paymentMethodSetting.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "この支払方法コードは既に使用されています" },
        { status: 400 }
      );
    }

    // 最大のdisplayOrderを取得
    const maxOrder = await prisma.paymentMethodSetting.aggregate({
      _max: { displayOrder: true },
    });

    // 新規作成
    await prisma.paymentMethodSetting.create({
      data: {
        code,
        displayName,
        isActive: true,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
    });

    // 更新後のデータを取得
    const paymentMethods = await prisma.paymentMethodSetting.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({
      paymentMethods,
    });
  } catch (error) {
    console.error("Create payment method error:", error);
    return NextResponse.json(
      { error: "支払方法の作成に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payment-methods - 支払方法削除
export async function DELETE(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const body = await request.json();
    const validationResult = deletePaymentMethodSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id } = validationResult.data;

    // 削除対象の存在確認
    const existing = await prisma.paymentMethodSetting.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "支払方法が見つかりません" },
        { status: 404 }
      );
    }

    // 削除
    await prisma.paymentMethodSetting.delete({
      where: { id },
    });

    // 更新後のデータを取得
    const paymentMethods = await prisma.paymentMethodSetting.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({
      paymentMethods,
    });
  } catch (error) {
    console.error("Delete payment method error:", error);
    return NextResponse.json(
      { error: "支払方法の削除に失敗しました" },
      { status: 500 }
    );
  }
}
