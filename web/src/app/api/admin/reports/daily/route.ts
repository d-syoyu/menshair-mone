// src/app/api/admin/reports/daily/route.ts
// MONË Salon - Daily Sales Report API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

// GET /api/admin/reports/daily - 日別売上レポート
export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    // デフォルトは今日
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // 当日の会計データを取得
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: targetDate,
          lt: nextDate,
        },
        paymentStatus: "PAID",
      },
      include: {
        items: true,
        payments: true,
      },
      orderBy: { saleTime: "asc" },
    });

    // 基本統計
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const saleCount = sales.length;
    const averagePerCustomer = saleCount > 0 ? Math.round(totalSales / saleCount) : 0;

    // 支払方法別集計
    const paymentMethodBreakdown: Record<string, { count: number; amount: number }> = {};
    for (const sale of sales) {
      for (const payment of sale.payments) {
        if (!paymentMethodBreakdown[payment.paymentMethod]) {
          paymentMethodBreakdown[payment.paymentMethod] = { count: 0, amount: 0 };
        }
        paymentMethodBreakdown[payment.paymentMethod].count += 1;
        paymentMethodBreakdown[payment.paymentMethod].amount += payment.amount;
      }
    }

    // カテゴリ別集計（メニュー）
    const categoryBreakdown: Record<string, { count: number; amount: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        if (item.itemType === "MENU" && item.category) {
          if (!categoryBreakdown[item.category]) {
            categoryBreakdown[item.category] = { count: 0, amount: 0 };
          }
          categoryBreakdown[item.category].count += item.quantity;
          categoryBreakdown[item.category].amount += item.subtotal;
        }
      }
    }

    // メニュー vs 商品の比率
    let menuTotal = 0;
    let productTotal = 0;
    for (const sale of sales) {
      for (const item of sale.items) {
        if (item.itemType === "MENU") {
          menuTotal += item.subtotal;
        } else {
          productTotal += item.subtotal;
        }
      }
    }

    // 時間帯別集計（1時間単位）
    const hourlyBreakdown: Record<string, { count: number; amount: number }> = {};
    for (let hour = 9; hour <= 21; hour++) {
      hourlyBreakdown[`${hour.toString().padStart(2, "0")}:00`] = { count: 0, amount: 0 };
    }

    for (const sale of sales) {
      const hour = parseInt(sale.saleTime.split(":")[0]);
      const hourKey = `${hour.toString().padStart(2, "0")}:00`;
      if (hourlyBreakdown[hourKey]) {
        hourlyBreakdown[hourKey].count += 1;
        hourlyBreakdown[hourKey].amount += sale.totalAmount;
      }
    }

    // 割引総額
    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discountAmount, 0);

    // 消費税総額
    const totalTax = sales.reduce((sum, sale) => sum + sale.taxAmount, 0);

    return NextResponse.json({
      date: targetDate.toISOString().split("T")[0],
      summary: {
        totalSales,
        saleCount,
        averagePerCustomer,
        totalDiscount,
        totalTax,
        menuTotal,
        productTotal,
      },
      paymentMethodBreakdown,
      categoryBreakdown,
      hourlyBreakdown,
      sales: sales.map((sale) => ({
        id: sale.id,
        saleNumber: sale.saleNumber,
        saleTime: sale.saleTime,
        totalAmount: sale.totalAmount,
        paymentMethod: sale.paymentMethod,
        customerName: sale.customerName,
        itemsSummary: sale.items.map((item) =>
          item.itemType === "MENU" ? item.menuName : item.productName
        ).filter(Boolean).slice(0, 2).join(", "),
      })),
    });
  } catch (error) {
    console.error("Get daily report error:", error);
    return NextResponse.json(
      { error: "日別レポートの取得に失敗しました" },
      { status: 500 }
    );
  }
}
