import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createCustomerSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  phone: z.string().min(1, "電話番号は必須です"),
  email: z.string().email("メールアドレスの形式が正しくありません").optional().nullable(),
});

const CUSTOMER_PAGE_SIZE = 30;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim() || null;
    // page を付けると顧客管理画面向けのページ単位の応答（件数・累計売上つき）を返す。
    // 付けない場合は従来どおり、予約・会計画面の顧客検索向けに配列を返す。
    const pageParam = searchParams.get("page");
    const paged = pageParam !== null;
    const page = Math.max(parseInt(pageParam || "1", 10) || 1, 1);
    const limit = paged
      ? CUSTOMER_PAGE_SIZE
      : Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 100);

    const where = {
      role: "CUSTOMER" as const,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { phone: { contains: query } },
              { email: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        skip: paged ? (page - 1) * limit : 0,
        take: limit,
      }),
      paged ? prisma.user.count({ where }) : Promise.resolve(0),
    ]);

    // 表示中の顧客分だけ、完了回数と累計売上を SQL でまとめて数える
    const customerIds = customers.map((customer) => customer.id);
    const [completedCounts, revenueRows] = customerIds.length
      ? await Promise.all([
          prisma.reservation.groupBy({
            by: ["userId"],
            where: { userId: { in: customerIds }, status: "COMPLETED" },
            _count: { _all: true },
          }),
          paged
            ? prisma.reservation.groupBy({
                by: ["userId"],
                where: { userId: { in: customerIds }, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
                _sum: { totalPrice: true },
              })
            : Promise.resolve([]),
        ])
      : [[], []];
    const completedCountByUserId = new Map(
      completedCounts.map((row) => [row.userId, row._count._all])
    );
    const revenueByUserId = new Map(
      revenueRows.map((row) => [row.userId, row._sum.totalPrice ?? 0])
    );

    const customersWithCounts = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      _count: {
        reservations: customer._count.reservations,
        completedReservations: completedCountByUserId.get(customer.id) ?? 0,
      },
      ...(paged ? { totalRevenue: revenueByUserId.get(customer.id) ?? 0 } : {}),
    }));

    if (paged) {
      return NextResponse.json({
        customers: customersWithCounts,
        page,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        total,
      });
    }
    return NextResponse.json(customersWithCounts);
  } catch (error) {
    console.error("Get customers error:", error);
    return NextResponse.json(
      { error: "顧客一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

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
