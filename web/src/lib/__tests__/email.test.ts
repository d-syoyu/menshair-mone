// src/lib/__tests__/email.test.ts
// MONË - Email Templates and Functions Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createNewsletterHtml,
  createNewsletterText,
  formatReservationDate,
  createReservationConfirmationHtml,
  createReservationConfirmationText,
  createReservationCancellationHtml,
  createReservationCancellationText,
  sendReservationConfirmationEmail,
  sendReservationCancellationEmail,
  createMagicLinkHtml,
  createMagicLinkText,
} from '../email';

describe('formatReservationDate', () => {
  it('日付を正しくフォーマットする（曜日付き）', () => {
    // 2025年1月15日（水）
    const date = new Date('2025-01-15T00:00:00');
    const result = formatReservationDate(date);
    expect(result).toBe('2025年1月15日（水）');
  });

  it('日曜日を正しくフォーマットする', () => {
    // 2025年1月19日（日）
    const date = new Date('2025-01-19T00:00:00');
    const result = formatReservationDate(date);
    expect(result).toBe('2025年1月19日（日）');
  });

  it('土曜日を正しくフォーマットする', () => {
    // 2025年1月18日（土）
    const date = new Date('2025-01-18T00:00:00');
    const result = formatReservationDate(date);
    expect(result).toBe('2025年1月18日（土）');
  });
});

describe('createNewsletterHtml', () => {
  it('必要な情報がHTMLに含まれる', () => {
    const html = createNewsletterHtml({
      title: 'テストニュース',
      subtitle: 'サブタイトル',
      excerpt: '本文の抜粋',
      slug: 'test-news',
      publishedAt: '2025.01.15',
    });

    expect(html).toContain('テストニュース');
    expect(html).toContain('サブタイトル');
    expect(html).toContain('本文の抜粋');
    expect(html).toContain('2025.01.15');
    expect(html).toContain('/news/test-news');
    expect(html).toContain('MONË');
  });

  it('カバー画像がある場合、imgタグが含まれる', () => {
    const html = createNewsletterHtml({
      title: 'テストニュース',
      slug: 'test-news',
      coverImage: 'https://example.com/image.jpg',
    });

    expect(html).toContain('<img');
    expect(html).toContain('https://example.com/image.jpg');
  });

  it('カバー画像がない場合、imgタグが含まれない', () => {
    const html = createNewsletterHtml({
      title: 'テストニュース',
      slug: 'test-news',
    });

    expect(html).not.toContain('<img');
  });
});

describe('createNewsletterText', () => {
  it('プレーンテキストに必要情報が含まれる', () => {
    const text = createNewsletterText({
      title: 'テストニュース',
      subtitle: 'サブタイトル',
      excerpt: '本文の抜粋',
      slug: 'test-news',
      publishedAt: '2025.01.15',
    });

    expect(text).toContain('テストニュース');
    expect(text).toContain('サブタイトル');
    expect(text).toContain('本文の抜粋');
    expect(text).toContain('2025.01.15');
    expect(text).toContain('/news/test-news');
  });

  it('カバー画像URLがテキストに含まれる', () => {
    const text = createNewsletterText({
      title: 'テストニュース',
      slug: 'test-news',
      coverImage: 'https://example.com/image.jpg',
    });

    expect(text).toContain('[画像] https://example.com/image.jpg');
  });
});

describe('createReservationConfirmationHtml', () => {
  const baseData = {
    reservationId: 'test-123',
    customerName: '田中太郎',
    date: new Date('2025-01-15T00:00:00'),
    startTime: '10:00',
    endTime: '11:30',
    menuSummary: 'カット、カラー',
    totalPrice: 15000,
    couponDiscount: 0,
  };

  it('必要な情報がHTMLに含まれる', () => {
    const html = createReservationConfirmationHtml(baseData);

    expect(html).toContain('test-123');
    expect(html).toContain('田中太郎');
    expect(html).toContain('2025年1月15日（水）');
    expect(html).toContain('10:00〜11:30');
    expect(html).toContain('カット、カラー');
    expect(html).toContain('¥15,000');
    expect(html).toContain('MONË');
    expect(html).toContain('キャンセルポリシー');
  });

  it('クーポン割引がある場合、割引額と割引後金額が表示される', () => {
    const html = createReservationConfirmationHtml({
      ...baseData,
      totalPrice: 15000,
      couponDiscount: 1000,
    });

    expect(html).toContain('¥15,000'); // 小計
    expect(html).toContain('-¥1,000'); // 割引額
    expect(html).toContain('¥14,000'); // 割引後金額
  });

  it('クーポン割引がない場合、割引関連表示がない', () => {
    const html = createReservationConfirmationHtml(baseData);

    expect(html).not.toContain('-¥0');
    expect(html).not.toContain('クーポン割引');
  });

  it('備考がある場合、表示される', () => {
    const html = createReservationConfirmationHtml({
      ...baseData,
      note: '前髪短めでお願いします',
    });

    expect(html).toContain('前髪短めでお願いします');
    expect(html).toContain('備考');
  });
});

describe('createReservationConfirmationText', () => {
  const baseData = {
    reservationId: 'test-456',
    customerName: '鈴木花子',
    date: new Date('2025-01-20T00:00:00'),
    startTime: '14:00',
    endTime: '15:00',
    menuSummary: 'ヘッドスパ',
    totalPrice: 8000,
    couponDiscount: 0,
  };

  it('プレーンテキストに必要情報が含まれる', () => {
    const text = createReservationConfirmationText(baseData);

    expect(text).toContain('test-456');
    expect(text).toContain('鈴木花子');
    expect(text).toContain('2025年1月20日（月）');
    expect(text).toContain('14:00〜15:00');
    expect(text).toContain('ヘッドスパ');
    expect(text).toContain('¥8,000');
  });

  it('クーポン割引がある場合、表示される', () => {
    const text = createReservationConfirmationText({
      ...baseData,
      couponDiscount: 500,
    });

    expect(text).toContain('クーポン割引: -¥500');
    expect(text).toContain('¥7,500');
  });
});

describe('createReservationCancellationHtml', () => {
  const baseData = {
    reservationId: 'cancel-789',
    customerName: '佐藤次郎',
    date: new Date('2025-01-25T00:00:00'),
    startTime: '11:00',
    menuSummary: 'シェービング',
  };

  it('キャンセル情報がHTMLに含まれる', () => {
    const html = createReservationCancellationHtml(baseData);

    expect(html).toContain('キャンセル');
    expect(html).toContain('cancel-789');
    expect(html).toContain('佐藤次郎');
    expect(html).toContain('2025年1月25日（土）');
    expect(html).toContain('11:00');
    expect(html).toContain('シェービング');
    expect(html).toContain('再度予約する');
    expect(html).toContain('/booking');
  });
});

describe('createReservationCancellationText', () => {
  const baseData = {
    reservationId: 'cancel-999',
    customerName: '高橋三郎',
    date: new Date('2025-02-01T00:00:00'),
    startTime: '16:00',
    menuSummary: 'カット、ヘッドスパ',
  };

  it('プレーンテキストにキャンセル情報が含まれる', () => {
    const text = createReservationCancellationText(baseData);

    expect(text).toContain('キャンセル');
    expect(text).toContain('cancel-999');
    expect(text).toContain('高橋三郎');
    expect(text).toContain('2025年2月1日（土）');
    expect(text).toContain('16:00');
    expect(text).toContain('カット、ヘッドスパ');
    expect(text).toContain('再度予約');
    expect(text).toContain('/booking');
  });
});

describe('sendReservationConfirmationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正常にメールを送信できる', async () => {
    const result = await sendReservationConfirmationEmail(
      'test@example.com',
      {
        reservationId: 'test-send-1',
        customerName: 'テスト太郎',
        date: new Date('2025-01-15T00:00:00'),
        startTime: '10:00',
        endTime: '11:00',
        menuSummary: 'カット',
        totalPrice: 5000,
        couponDiscount: 0,
      }
    );

    expect(result.success).toBe(true);
  });
});

describe('sendReservationCancellationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正常にキャンセルメールを送信できる', async () => {
    const result = await sendReservationCancellationEmail(
      'test@example.com',
      {
        reservationId: 'test-cancel-1',
        customerName: 'テスト花子',
        date: new Date('2025-01-20T00:00:00'),
        startTime: '14:00',
        menuSummary: 'カラー',
      }
    );

    expect(result.success).toBe(true);
  });
});

describe('createMagicLinkHtml', () => {
  const baseParams = {
    url: 'https://mone0601.com/api/auth/callback/resend?token=abc123',
    host: 'mone0601.com',
  };

  it('必要な情報がHTMLに含まれる', () => {
    const html = createMagicLinkHtml(baseParams);

    expect(html).toContain('MONË');
    expect(html).toContain('ログイン認証');
    expect(html).toContain('ログインする');
    expect(html).toContain(baseParams.url);
    expect(html).toContain('24時間有効');
  });

  it('サロン情報がフッターに含まれる', () => {
    const html = createMagicLinkHtml(baseParams);

    expect(html).toContain('〒570-0036');
    expect(html).toContain('八雲中町1-24-1');
    expect(html).toContain('06-6908-4859');
  });
});

describe('createMagicLinkText', () => {
  const baseParams = {
    url: 'https://mone0601.com/api/auth/callback/resend?token=xyz789',
    host: 'mone0601.com',
  };

  it('プレーンテキストに必要情報が含まれる', () => {
    const text = createMagicLinkText(baseParams);

    expect(text).toContain('MONË');
    expect(text).toContain('ログイン認証');
    expect(text).toContain(baseParams.url);
    expect(text).toContain('24時間有効');
  });

  it('心当たりがない場合の注意書きが含まれる', () => {
    const text = createMagicLinkText(baseParams);

    expect(text).toContain('心当たりがない場合');
    expect(text).toContain('無視');
  });
});
