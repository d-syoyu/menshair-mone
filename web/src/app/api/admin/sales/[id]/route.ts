// src/app/api/admin/sales/[id]/route.ts
// MONË Salon - Sale Individual API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";

// 会計明細スキーマ
const saleItemSchema = z.object({
  itemType: z.enum(["MENU", "PRODUCT"]),
  menuId: z.string().optional(),
  menuName: z.string().optional(),
  category: z.string().optional(),
  duration: z.number().int().optional(),
  productId: z.string().optional(),
  productName: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().int().min(0),
});

// 支払詳細スキーマ
const paymentSchema = z.object({
  paymentMethod: z.enum([
    "CASH",
    "CREDIT_CARD",
    "PAYPAY",
    "LINE_PAY",
    "RAKUTEN_PAY",
    "AU_PAY",
    "D_PAYMENT",
    "MERPAY",
    "BANK_TRANSFER",
    "OTHER",
  ]),
  amount: z.number().int().positive(),
});

// 会計更新スキーマ
const updateSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "明細は1件以上必要です").optional(),
  payments: z.array(paymentSchema).min(1, "支払情報は1件以上必要です").optional(),
  discountAmount: z.number().int().min(0).optional(),
  note: z.string().optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "REFUNDED", "CANCELLED"]).optional(),
});

// GET /api/admin/sales/[id] - 会計詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { id } = await params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        reservation: {
          select: {
            id: true,
            date: true,
            startTime: true,
            status: true,
          },
        },
        items: {
          orderBy: { orderIndex: "asc" },
        },
        payments: {
          orderBy: { orderIndex: "asc" },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "会計が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Get sale error:", error);
    return NextResponse.json(
      { error: "会計の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/sales/[id] - 会計更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const validationResult = updateSaleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 既存会計取得
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "会計が見つかりません" },
        { status: 404 }
      );
    }

    // 明細・支払が更新される場合、再計算
    let updateData: Record<string, unknown> = {};

    if (data.items || data.discountAmount !== undefined) {
      const items = data.items || existingSale.items;
      const discountAmount = data.discountAmount ?? existingSale.discountAmount;

      // 小計計算
      const subtotal = items.reduce((sum, item) => {
        return sum + item.unitPrice * item.quantity;
      }, 0);

      // 税額計算
      const taxableAmount = Math.max(0, subtotal - discountAmount);
      const taxAmount = Math.floor(taxableAmount * (existingSale.taxRate / 100));

      // 合計金額
      const totalAmount = taxableAmount + taxAmount;

      updateData = {
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
      };
    }

    // 支払情報更新時の検証
    if (data.payments) {
      const totalAmount = updateData.totalAmount ?? existingSale.totalAmount;
      const paymentTotal = data.payments.reduce((sum, p) => sum + p.amount, 0);

      if (paymentTotal !== totalAmount) {
        return NextResponse.json(
          { error: `支払総額が合計金額と一致しません（支払: ¥${paymentTotal}, 合計: ¥${totalAmount}）` },
          { status: 400 }
        );
      }

      updateData.paymentMethod = data.payments[0].paymentMethod;
    }

    // 支払ステータス更新
    if (data.paymentStatus) {
      updateData.paymentStatus = data.paymentStatus;
    }

    // 備考更新
    if (data.note !== undefined) {
      updateData.note = data.note;
    }

    // トランザクション処理
    await prisma.$transaction(async (tx) => {
      // 会計更新
      const sale = await tx.sale.update({
        where: { id },
        data: updateData,
      });

      // 明細更新（既存削除→新規作成）
      if (data.items) {
        await tx.saleItem.deleteMany({
          where: { saleId: id },
        });

        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          await tx.saleItem.create({
            data: {
              saleId: id,
              itemType: item.itemType,
              menuId: item.menuId,
              menuName: item.menuName,
              category: item.category,
              duration: item.duration,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.unitPrice * item.quantity,
              orderIndex: i,
            },
          });
        }
      }

      // 支払詳細更新（既存削除→新規作成）
      if (data.payments) {
        await tx.payment.deleteMany({
          where: { saleId: id },
        });

        for (let i = 0; i < data.payments.length; i++) {
          const payment = data.payments[i];
          await tx.payment.create({
            data: {
              saleId: id,
              paymentMethod: payment.paymentMethod,
              amount: payment.amount,
              orderIndex: i,
            },
          });
        }
      }

      return sale;
    });

    // 更新後のデータを取得
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          orderBy: { orderIndex: "asc" },
        },
        payments: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Update sale error:", error);
    return NextResponse.json(
      { error: "会計の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/sales/[id] - 会計削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { id } = await params;

    // 会計存在チェック
    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "会計が見つかりません" },
        { status: 404 }
      );
    }

    // 削除処理（SaleItem, Paymentはカスケード削除される）
    await prisma.sale.delete({
      where: { id },
    });

    return NextResponse.json({ message: "会計を削除しました" });
  } catch (error) {
    console.error("Delete sale error:", error);
    return NextResponse.json(
      { error: "会計の削除に失敗しました" },
      { status: 500 }
    );
  }
}
