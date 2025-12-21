// scripts/test-newsletter-targets.ts
// 配信先（条件）ごとのニュースレター配信テスト
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Dynamic imports
  const { filterCustomersByTargets, getActiveCategories } = await import('../src/lib/customer-filter');

  if (command === 'list') {
    // 利用可能な配信先一覧を表示
    console.log('\n📋 利用可能な配信先:\n');
    console.log('  基本セグメント:');
    console.log('    - すべて        : 全顧客');
    console.log('    - 管理者        : 管理者ユーザー（テスト用）');
    console.log('    - 新規顧客      : 30日以内に初会計');
    console.log('    - リピーター    : 2回以上会計');
    console.log('    - 最近来店      : 60日以内に会計');
    console.log('    - 休眠顧客      : 90日以上会計なし');
    console.log('    - 予約あり      : 今後の予約がある');
    console.log('\n  カテゴリ別:');

    const categories = await getActiveCategories();
    for (const cat of categories) {
      console.log(`    - ${cat.name}利用あり  : ${cat.name}を利用したことがある`);
      console.log(`    - ${cat.name}利用なし  : ${cat.name}を利用したことがない`);
    }

    console.log('\n使用方法:');
    console.log('  npx tsx scripts/test-newsletter-targets.ts check <配信先>');
    console.log('  npx tsx scripts/test-newsletter-targets.ts send <配信先> <件名>');
    console.log('\n例:');
    console.log('  npx tsx scripts/test-newsletter-targets.ts check 管理者');
    console.log('  npx tsx scripts/test-newsletter-targets.ts send 管理者 "テストメール"');
    return;
  }

  if (command === 'check') {
    // 配信先の顧客数を確認
    const target = args[1];
    if (!target) {
      console.log('Usage: npx tsx scripts/test-newsletter-targets.ts check <配信先>');
      console.log('       npx tsx scripts/test-newsletter-targets.ts list で一覧表示');
      return;
    }

    console.log(`\n🔍 配信先「${target}」の顧客を検索中...\n`);

    const customers = await filterCustomersByTargets({ targets: [target] });

    if (customers.length === 0) {
      console.log('❌ 該当する顧客がいません');
    } else {
      console.log(`✅ ${customers.length}件の顧客が該当:\n`);
      for (const customer of customers) {
        console.log(`  - ${customer.name || '(名前なし)'} <${customer.email}>`);
      }
    }
    return;
  }

  if (command === 'send') {
    // 配信先に実際にメール送信
    const target = args[1];
    const subject = args[2] || 'テストニュースレター';

    if (!target) {
      console.log('Usage: npx tsx scripts/test-newsletter-targets.ts send <配信先> [件名]');
      return;
    }

    console.log(`\n📧 配信先「${target}」にメール送信中...\n`);

    const customers = await filterCustomersByTargets({ targets: [target] });

    if (customers.length === 0) {
      console.log('❌ 該当する顧客がいません。送信を中止します。');
      return;
    }

    console.log(`📋 対象顧客: ${customers.length}件`);
    for (const customer of customers) {
      console.log(`  - ${customer.name || '(名前なし)'} <${customer.email}>`);
    }

    const { sendEmail, createNewsletterHtml, createNewsletterText } = await import('../src/lib/email');

    const html = createNewsletterHtml({
      title: subject,
      subtitle: `配信先テスト: ${target}`,
      excerpt: `このメールは「${target}」配信先のテストです。正しく受信できていれば成功です。`,
      slug: 'test',
      publishedAt: new Date().toLocaleDateString('ja-JP'),
    });

    const text = createNewsletterText({
      title: subject,
      subtitle: `配信先テスト: ${target}`,
      excerpt: `このメールは「${target}」配信先のテストです。`,
      slug: 'test',
      publishedAt: new Date().toLocaleDateString('ja-JP'),
    });

    const emails = customers.map(c => c.email);

    console.log(`\n📤 送信中...`);

    const result = await sendEmail({
      to: emails,
      subject: `【MONË】${subject}`,
      html,
      text,
    });

    if (result.success) {
      console.log(`\n✅ 送信成功!`);
      console.log(`   送信先: ${emails.length}件`);
    } else {
      console.log(`\n❌ 送信失敗`);
      console.log(`   エラー: ${result.error}`);
    }
    return;
  }

  // デフォルト: ヘルプ表示
  console.log('\n📧 ニュースレター配信先テストツール\n');
  console.log('コマンド:');
  console.log('  list              : 利用可能な配信先一覧を表示');
  console.log('  check <配信先>    : 配信先の顧客数を確認（送信しない）');
  console.log('  send <配信先> [件名] : 配信先に実際にメール送信');
  console.log('\n例:');
  console.log('  npx tsx scripts/test-newsletter-targets.ts list');
  console.log('  npx tsx scripts/test-newsletter-targets.ts check 管理者');
  console.log('  npx tsx scripts/test-newsletter-targets.ts send 管理者 "テスト配信"');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
