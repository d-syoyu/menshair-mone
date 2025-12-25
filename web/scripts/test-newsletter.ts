// scripts/test-newsletter.ts
// ニュースレター配信テスト
import * as dotenv from 'dotenv';
// Load both .env files (env.local for DATABASE_URL, .env for API keys)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: npx tsx scripts/test-newsletter.ts <email>');
    return;
  }

  console.log(`Sending test newsletter to: ${email}`);
  console.log('RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);

  // Dynamic import after env vars are loaded
  const { sendEmail, createNewsletterHtml, createNewsletterText } = await import('../src/lib/email');

  const html = createNewsletterHtml({
    title: 'テストニュースレター',
    subtitle: 'メール配信テストです',
    excerpt: 'このメールはニュースレター配信のテストです。正しく受信できていれば成功です。',
    slug: 'test',
    publishedAt: new Date().toLocaleDateString('ja-JP'),
    coverImage: 'https://www.mone0601.com/mone-logo.png',
  });

  const text = createNewsletterText({
    title: 'テストニュースレター',
    subtitle: 'メール配信テストです',
    excerpt: 'このメールはニュースレター配信のテストです。正しく受信できていれば成功です。',
    slug: 'test',
    publishedAt: new Date().toLocaleDateString('ja-JP'),
    coverImage: 'https://www.mone0601.com/mone-logo.png',
  });

  const result = await sendEmail({
    to: email,
    subject: '【MONË】テストニュースレター',
    html,
    text,
  });

  if (result.success) {
    console.log('✅ Newsletter sent successfully!');
    console.log('Result:', result.data);
  } else {
    console.log('❌ Failed to send newsletter');
    console.log('Error:', result.error);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
