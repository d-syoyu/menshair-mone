import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { getJstTodayDbDate } from "@/lib/date-utils";

function getTodayStart() {
  return getJstTodayDbDate();
}

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const todayStart = getTodayStart();

    const [
      menus,
      products,
      productCategories,
      discounts,
      paymentMethods,
      taxRateSetting,
      reservations,
      coupons,
    ] = await Promise.all([
      prisma.menu.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          categoryId: true,
          price: true,
          priceVariable: true,
          duration: true,
          displayOrder: true,
          isActive: true,
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          categoryId: true,
          price: true,
          stock: true,
          displayOrder: true,
          isActive: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
      }),
      prisma.productCategory.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
        },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.discount.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.paymentMethodSetting.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.settings.findUnique({
        where: { key: "tax_rate" },
        select: { value: true },
      }),
      prisma.reservation.findMany({
        where: {
          status: "CONFIRMED",
          date: { gte: todayStart },
        },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          status: true,
          totalPrice: true,
          menuSummary: true,
          couponId: true,
          couponCode: true,
          couponDiscount: true,
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          items: {
            select: {
              id: true,
              menuId: true,
              menuName: true,
              category: true,
              price: true,
              duration: true,
            },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 100,
      }),
      prisma.coupon.findMany({
        where: {
          isActive: true,
          validUntil: { gte: new Date() },
        },
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          value: true,
          description: true,
          validFrom: true,
          validUntil: true,
          minimumAmount: true,
          usageLimit: true,
          usageCount: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      menus,
      products,
      productCategories,
      discounts,
      paymentMethods,
      taxRate: Number.parseInt(taxRateSetting?.value || "10", 10),
      reservations,
      coupons,
    });
  } catch (err) {
    console.error("Admin POS bootstrap error:", err);
    return NextResponse.json(
      { error: "POS初期データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
