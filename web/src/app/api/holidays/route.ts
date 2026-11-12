import { NextRequest, NextResponse } from "next/server";
import { getPublicHolidays } from "@/lib/public-holidays";

// 公開カレンダー用。DB を毎回起こさないよう getPublicHolidays（キャッシュ・管理画面の変更で即時破棄）を使う。
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    if (!yearParam) {
      return NextResponse.json({ error: "年を指定してください" }, { status: 400 });
    }

    const year = Number(yearParam);
    const month = monthParam ? Number(monthParam) : null;
    if (
      !Number.isInteger(year) || year < 2000 || year > 2100 ||
      (month !== null && (!Number.isInteger(month) || month < 1 || month > 12))
    ) {
      return NextResponse.json({ error: "年月の指定が正しくありません" }, { status: 400 });
    }

    return NextResponse.json(await getPublicHolidays(year, month));
  } catch (error) {
    console.error("Get holidays error:", error);
    return NextResponse.json(
      { error: "休業日の取得に失敗しました" },
      { status: 500 }
    );
  }
}
