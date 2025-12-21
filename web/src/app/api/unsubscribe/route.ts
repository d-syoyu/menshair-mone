// src/app/api/unsubscribe/route.ts
// ニュースレター配信停止API

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUnsubscribeToken } from '@/lib/newsletter';

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: 'メールアドレスとトークンが必要です' },
        { status: 400 }
      );
    }

    // トークンを検証
    if (!verifyUnsubscribeToken(email, token)) {
      return NextResponse.json(
        { error: '無効なリクエストです' },
        { status: 400 }
      );
    }

    // ユーザーを検索して配信停止を設定
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // ユーザーが見つからなくても成功を返す（セキュリティ対策）
      return NextResponse.json({ success: true });
    }

    // 配信停止を設定
    await prisma.user.update({
      where: { id: user.id },
      data: { newsletterOptOut: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: '処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// GETメソッドでも受け付ける（メールからのワンクリック配信停止用）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email || !token) {
    return NextResponse.redirect(
      new URL('/unsubscribe?error=invalid', request.url)
    );
  }

  // トークンを検証
  if (!verifyUnsubscribeToken(email, token)) {
    return NextResponse.redirect(
      new URL('/unsubscribe?error=invalid', request.url)
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { newsletterOptOut: true },
      });
    }

    // 成功ページにリダイレクト
    return NextResponse.redirect(
      new URL('/unsubscribe?success=true', request.url)
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.redirect(
      new URL('/unsubscribe?error=server', request.url)
    );
  }
}
