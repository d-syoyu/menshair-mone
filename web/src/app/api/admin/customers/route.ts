// src/app/api/admin/customers/route.ts
// MONË - Customers Admin API (電話予約対応)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

// 顧客作成スキーマ
const createCustomerSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  phone: z.string().min(1, "電話番号は必須です"),
  email: z.string().email("メールアドレスの形式が正しくありません").optional().nullable(),
});

// GET /api/admin/customers - 顧客一覧取得（検索対応）
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    const customers = await prisma.user.findMany({
      where: {
        ...where,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            reservations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Get customers error:", error);
    return NextResponse.json(
      { error: "顧客一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/admin/customers - 顧客作成（電話予約用）
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createCustomerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, phone, email } = validationResult.data;

    // 電話番号の重複チェック
    if (phone) {
      const existingByPhone = await prisma.user.findFirst({
        where: { phone },
      });

      if (existingByPhone) {
        return NextResponse.json(
          { error: "この電話番号は既に登録されています", existingCustomer: existingByPhone },
          { status: 409 }
        );
      }
    }

    // メールの重複チェック
    if (email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        return NextResponse.json(
          { error: "このメールアドレスは既に登録されています", existingCustomer: existingByEmail },
          { status: 409 }
        );
      }
    }

    const customer = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json(
      { error: "顧客の作成に失敗しました" },
      { status: 500 }
    );
  }
}
