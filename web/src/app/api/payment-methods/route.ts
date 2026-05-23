// src/app/api/payment-methods/route.ts
// MONË Salon - 公開用支払方法API

import { NextResponse } from "next/server";
import { getCachedPaymentMethods } from "@/lib/payment-methods";

export const revalidate = 3600;

// GET /api/payment-methods - 有効な支払方法一覧を取得（公開API）
export async function GET() {
  try {
    const paymentMethods = await getCachedPaymentMethods();

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error("Get payment methods error:", error);
    return NextResponse.json(
      { error: "支払方法の取得に失敗しました" },
      { status: 500 }
    );
  }
}
