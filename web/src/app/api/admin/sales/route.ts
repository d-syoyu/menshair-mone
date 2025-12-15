// src/app/api/admin/sales/route.ts
// MONË Salon - Sales Admin API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";
import { parseLocalDate, parseLocalDateStart, parseLocalDateEnd } from "@/lib/date-utils";
import { validateCoupon } from "@/lib/coupon-validation";

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

// 支払詳細スキーマ（支払方法は動的に追加可能なためstringで受け付ける）
const paymentSchema = z.object({
  paymentMethod: z.string().min(1, "支払方法は必須です"),
  amount: z.number().int().positive(),
});

// 会計作成スキーマ
const createSaleSchema = z.object({
  userId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  reservationId: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "明細は1件以上必要です"),
  payments: z.array(paymentSchema).min(1, "支払情報は1件以上必要です"),
  discountAmount: z.number().int().min(0).default(0), // 店頭割引
  couponId: z.string().optional(), // クーポンID
  couponDiscount: z.number().int().min(0).default(0), // クーポン割引額
  note: z.string().optional(),
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式が不正です"),
  saleTime: z.string().regex(/^\d{2}:\d{2}$/, "時刻形式が不正です"),
});

// 伝票番号の自動採番
async function generateSaleNumber(saleDate: Date): Promise<string> {
  const dateStr = saleDate.toISOString().split("T")[0].replace(/-/g, "");
  const prefix = `SALE-${dateStr}-`;

  // 同日の最新伝票番号を取得
  const latestSale = await prisma.sale.findFirst({
    where: {
      saleNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      saleNumber: "desc",
    },
    select: {
      saleNumber: true,
    },
  });

  let sequence = 1;
  if (latestSale) {
    const lastSequence = parseInt(latestSale.saleNumber.split("-")[2]);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(3, "0")}`;
}

// GET /api/admin/sales - 会計履歴一覧取得
export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const customerName = searchParams.get("customerName");
    const paymentMethod = searchParams.get("paymentMethod");
    const paymentStatus = searchParams.get("paymentStatus");

    const where: any = {};

    // 日付範囲フィルタ（タイムゾーン対応）
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = parseLocalDateStart(startDate);
      }
      if (endDate) {
        where.saleDate.lte = parseLocalDateEnd(endDate);
      }
    }

    // 顧客名検索
    if (customerName) {
      where.OR = [
        { customerName: { contains: customerName } },
        { user: { name: { contains: customerName } } },
      ];
    }

    // 支払方法フィルタ
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    // 支払ステータスフィルタ
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        items: {
          orderBy: { orderIndex: "asc" },
        },
        payments: {
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: [{ saleDate: "desc" }, { saleTime: "desc" }],
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Get sales error:", error);
    return NextResponse.json(
      { error: "会計履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/admin/sales - 会計作成
export async function POST(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error, user } = await checkAdminAuth();
    if (error) return error;

    // createdByUserIdがデータベースに存在するか確認
    let createdByUserId: string | null = null;
    if (user?.id) {
      const userExists = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true },
      });
      if (userExists) {
        createdByUserId = user.id;
      }
    }

    const body = await request.json();
    const validationResult = createSaleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 税率取得
    const taxRateSetting = await prisma.settings.findUnique({
      where: { key: "tax_rate" },
    });
    const taxRate = parseInt(taxRateSetting?.value || "10");

    // 小計計算
    const subtotal = data.items.reduce((sum, item) => {
      return sum + item.unitPrice * item.quantity;
    }, 0);

    // 合計割引額（店頭割引 + クーポン割引）
    const totalDiscount = data.discountAmount + data.couponDiscount;

    // 内税方式: 小計は税込価格、割引後の金額から消費税を逆算
    const totalAmount = Math.max(0, subtotal - totalDiscount);
    // 内税計算: 税込金額 × 税率 ÷ (100 + 税率)
    const taxAmount = Math.floor(totalAmount * taxRate / (100 + taxRate));

    // クーポンの検証（指定されている場合）
    if (data.couponId) {
      // まずクーポンIDからクーポンコードを取得
      const couponRecord = await prisma.coupon.findUnique({
        where: { id: data.couponId },
        select: { code: true },
      });

      if (!couponRecord) {
        return NextResponse.json(
          { error: "指定されたクーポンが見つかりません" },
          { status: 400 }
        );
      }

      // 共通検証関数で全条件をチェック
      const menuIds = data.items
        .filter((i) => i.itemType === "MENU" && i.menuId)
        .map((i) => i.menuId!);
      const categories = data.items
        .filter((i) => i.category)
        .map((i) => i.category as string);
      const saleDateObj = parseLocalDate(data.saleDate);
      const weekday = saleDateObj.getDay();

      const couponResult = await validateCoupon({
        code: couponRecord.code,
        subtotal,
        customerId: data.userId,
        menuIds,
        categories,
        weekday,
        time: data.saleTime,
      });

      if (!couponResult.valid) {
        return NextResponse.json(
          { error: couponResult.error },
          { status: 400 }
        );
      }
    }

    // 支払総額チェック
    const paymentTotal = data.payments.reduce((sum, p) => sum + p.amount, 0);
    if (paymentTotal !== totalAmount) {
      return NextResponse.json(
        { error: `支払総額が合計金額と一致しません（支払: ¥${paymentTotal}, 合計: ¥${totalAmount}）` },
        { status: 400 }
      );
    }

    // 伝票番号生成（タイムゾーン対応）
    const saleDate = parseLocalDate(data.saleDate);
    const saleNumber = await generateSaleNumber(saleDate);

    // 主要支払方法（第1支払）
    const primaryPaymentMethod = data.payments[0].paymentMethod;

    // トランザクション処理
    const sale = await prisma.$transaction(async (tx) => {
      // 会計作成
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          userId: data.userId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          reservationId: data.reservationId,
          subtotal,
          taxAmount,
          taxRate,
          discountAmount: data.discountAmount,
          couponId: data.couponId,
          couponDiscount: data.couponDiscount,
          totalAmount,
          paymentMethod: primaryPaymentMethod,
          paymentStatus: "PAID",
          saleDate,
          saleTime: data.saleTime,
          note: data.note,
          createdBy: createdByUserId,
        },
      });

      // クーポン利用履歴の作成と利用回数の更新
      if (data.couponId) {
        await tx.couponUsage.create({
          data: {
            couponId: data.couponId,
            saleId: newSale.id,
            customerId: data.userId,
          },
        });

        await tx.coupon.update({
          where: { id: data.couponId },
          data: {
            usageCount: { increment: 1 },
          },
        });
      }

      // 会計明細作成
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
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

      // 支払詳細作成
      for (let i = 0; i < data.payments.length; i++) {
        const payment = data.payments[i];
        await tx.payment.create({
          data: {
            saleId: newSale.id,
            paymentMethod: payment.paymentMethod,
            amount: payment.amount,
            orderIndex: i,
          },
        });
      }

      // 予約と紐付いている場合、予約のステータスをCOMPLETEDに更新
      if (data.reservationId) {
        await tx.reservation.update({
          where: { id: data.reservationId },
          data: { status: "COMPLETED" },
        });
      }

      return newSale;
    });

    // 作成した会計を関連データと共に取得
    const createdSale = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            name: true,
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

    return NextResponse.json(createdSale, { status: 201 });
  } catch (error) {
    console.error("Create sale error:", error);
    return NextResponse.json(
      { error: "会計の作成に失敗しました" },
      { status: 500 }
    );
  }
}
