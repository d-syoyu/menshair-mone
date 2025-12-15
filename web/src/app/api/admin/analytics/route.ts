// src/app/api/admin/analytics/route.ts
// MONË Salon - Sales Analytics API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

// GET /api/admin/analytics - 売上分析データ取得
export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    // デフォルトは過去30日間
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    // 会計データを取得
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        paymentStatus: "PAID",
      },
      include: {
        items: true,
        payments: true,
      },
    });

    // 基本統計
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const saleCount = sales.length;
    const averagePerCustomer = saleCount > 0 ? Math.round(totalSales / saleCount) : 0;

    // 支払方法別集計
    const paymentMethodData: Record<string, { count: number; amount: number; percentage: number }> = {};
    let totalPaymentAmount = 0;

    for (const sale of sales) {
      for (const payment of sale.payments) {
        if (!paymentMethodData[payment.paymentMethod]) {
          paymentMethodData[payment.paymentMethod] = { count: 0, amount: 0, percentage: 0 };
        }
        paymentMethodData[payment.paymentMethod].count += 1;
        paymentMethodData[payment.paymentMethod].amount += payment.amount;
        totalPaymentAmount += payment.amount;
      }
    }

    // パーセンテージ計算
    for (const method of Object.keys(paymentMethodData)) {
      paymentMethodData[method].percentage = totalPaymentAmount > 0
        ? Math.round((paymentMethodData[method].amount / totalPaymentAmount) * 1000) / 10
        : 0;
    }

    // メニュー別集計
    const menuData: Record<string, {
      menuId: string;
      menuName: string;
      category: string | null;
      count: number;
      amount: number;
      percentage: number;
    }> = {};
    let totalMenuAmount = 0;

    for (const sale of sales) {
      for (const item of sale.items) {
        if (item.itemType === "MENU" && item.menuName) {
          const key = item.menuId || item.menuName;
          if (!menuData[key]) {
            menuData[key] = {
              menuId: item.menuId || "",
              menuName: item.menuName,
              category: item.category,
              count: 0,
              amount: 0,
              percentage: 0,
            };
          }
          menuData[key].count += item.quantity;
          menuData[key].amount += item.subtotal;
          totalMenuAmount += item.subtotal;
        }
      }
    }

    // メニューパーセンテージ計算
    for (const key of Object.keys(menuData)) {
      menuData[key].percentage = totalMenuAmount > 0
        ? Math.round((menuData[key].amount / totalMenuAmount) * 1000) / 10
        : 0;
    }

    // 商品別集計
    const productData: Record<string, {
      productId: string;
      productName: string;
      count: number;
      amount: number;
      percentage: number;
    }> = {};
    let totalProductAmount = 0;

    for (const sale of sales) {
      for (const item of sale.items) {
        if (item.itemType === "PRODUCT" && item.productName) {
          const key = item.productId || item.productName;
          if (!productData[key]) {
            productData[key] = {
              productId: item.productId || "",
              productName: item.productName,
              count: 0,
              amount: 0,
              percentage: 0,
            };
          }
          productData[key].count += item.quantity;
          productData[key].amount += item.subtotal;
          totalProductAmount += item.subtotal;
        }
      }
    }

    // 商品パーセンテージ計算
    for (const key of Object.keys(productData)) {
      productData[key].percentage = totalProductAmount > 0
        ? Math.round((productData[key].amount / totalProductAmount) * 1000) / 10
        : 0;
    }

    // カテゴリ別集計（メニュー）
    const categoryData: Record<string, {
      category: string;
      count: number;
      amount: number;
      percentage: number;
    }> = {};

    for (const sale of sales) {
      for (const item of sale.items) {
        if (item.itemType === "MENU" && item.category) {
          if (!categoryData[item.category]) {
            categoryData[item.category] = {
              category: item.category,
              count: 0,
              amount: 0,
              percentage: 0,
            };
          }
          categoryData[item.category].count += item.quantity;
          categoryData[item.category].amount += item.subtotal;
        }
      }
    }

    // カテゴリパーセンテージ計算
    for (const key of Object.keys(categoryData)) {
      categoryData[key].percentage = totalMenuAmount > 0
        ? Math.round((categoryData[key].amount / totalMenuAmount) * 1000) / 10
        : 0;
    }

    // 日別推移データ
    const dailyTrend: Record<string, { date: string; amount: number; count: number }> = {};

    for (const sale of sales) {
      const dateStr = sale.saleDate.toISOString().split("T")[0];
      if (!dailyTrend[dateStr]) {
        dailyTrend[dateStr] = { date: dateStr, amount: 0, count: 0 };
      }
      dailyTrend[dateStr].amount += sale.totalAmount;
      dailyTrend[dateStr].count += 1;
    }

    // 営業日数を計算（定休日・不定休を除外）
    // 不定休（終日休業）を取得
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        startTime: null, // 終日休業のみ（時間帯休業は営業日としてカウント）
      },
      select: { date: true },
    });
    const holidayDates = new Set(
      holidays.map((h) => h.date.toISOString().split("T")[0])
    );

    // 定休日: 月曜日 (1)
    const CLOSED_DAY = 1;

    // 期間内の営業日数をカウント
    let businessDays = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split("T")[0];

      // 定休日（月曜）でなく、不定休（終日）でなければ営業日
      if (dayOfWeek !== CLOSED_DAY && !holidayDates.has(dateStr)) {
        businessDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 営業日平均売上
    const averagePerBusinessDay = businessDays > 0 ? Math.round(totalSales / businessDays) : 0;

    // トップ10リスト作成
    const topMenus = Object.values(menuData)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const topProducts = Object.values(productData)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const topCategories = Object.values(categoryData)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return NextResponse.json({
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      summary: {
        totalSales,
        saleCount,
        averagePerCustomer,
        totalMenuAmount,
        totalProductAmount,
        businessDays,
        averagePerBusinessDay,
      },
      paymentMethod: {
        data: paymentMethodData,
        sortedList: Object.entries(paymentMethodData)
          .map(([method, data]) => ({ method, ...data }))
          .sort((a, b) => b.amount - a.amount),
      },
      menu: {
        topMenus,
        topCategories,
        totalAmount: totalMenuAmount,
      },
      product: {
        topProducts,
        totalAmount: totalProductAmount,
      },
      dailyTrend: Object.values(dailyTrend).sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { error: "分析データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
