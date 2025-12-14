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

// DELETE /api/admin/customers/[id] - 顧客削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { id } = await params;

    // 顧客が存在するか確認
    const existingCustomer = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reservations: true },
        },
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "顧客が見つかりません" },
        { status: 404 }
      );
    }

    // 管理者は削除不可
    if (existingCustomer.role === "ADMIN") {
      return NextResponse.json(
        { error: "管理者アカウントは削除できません" },
        { status: 403 }
      );
    }

    // 予約がある場合は関連データも含めて削除（カスケード）
    // 予約アイテムは予約に紐づいているので、予約削除時に一緒に削除される
    if (existingCustomer._count.reservations > 0) {
      // 関連する予約アイテムを先に削除
      await prisma.reservationItem.deleteMany({
        where: {
          reservation: {
            userId: id,
          },
        },
      });

      // 予約を削除
      await prisma.reservation.deleteMany({
        where: { userId: id },
      });
    }

    // アカウント（OAuth連携）があれば削除
    await prisma.account.deleteMany({
      where: { userId: id },
    });

    // セッションがあれば削除
    await prisma.session.deleteMany({
      where: { userId: id },
    });

    // 顧客を削除
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "顧客を削除しました" });
  } catch (error) {
    console.error("Delete customer error:", error);
    return NextResponse.json(
      { error: "顧客の削除に失敗しました" },
      { status: 500 }
    );
  }
}
