// src/app/api/admin/customers/[id]/route.ts
// MONË - Customer Update API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 顧客更新スキーマ
const updateCustomerSchema = z.object({
  name: z.string().min(1, "名前は必須です").optional(),
  phone: z.string().min(1, "電話番号は必須です").optional(),
  email: z.string().email("メールアドレスの形式が正しくありません").optional().nullable(),
});

// GET /api/admin/customers/[id] - 顧客詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { id } = await params;

    const customer = await prisma.user.findUnique({
      where: { id },
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
    });

    if (!customer) {
      return NextResponse.json(
        { error: "顧客が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Get customer error:", error);
    return NextResponse.json(
      { error: "顧客情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/customers/[id] - 顧客情報更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = updateCustomerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, phone, email } = validationResult.data;

    // 顧客が存在するか確認
    const existingCustomer = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "顧客が見つかりません" },
        { status: 404 }
      );
    }

    // 電話番号の重複チェック（自分以外）
    if (phone && phone !== existingCustomer.phone) {
      const existingByPhone = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: id },
        },
      });

      if (existingByPhone) {
        return NextResponse.json(
          { error: "この電話番号は既に登録されています" },
          { status: 409 }
        );
      }
    }

    // メールの重複チェック（自分以外）
    if (email && email !== existingCustomer.email) {
      const existingByEmail = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id },
        },
      });

      if (existingByEmail) {
        return NextResponse.json(
          { error: "このメールアドレスは既に登録されています" },
          { status: 409 }
        );
      }
    }

    const updatedCustomer = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json(
      { error: "顧客情報の更新に失敗しました" },
      { status: 500 }
    );
  }
}
