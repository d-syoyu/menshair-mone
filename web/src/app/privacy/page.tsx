'use client';

import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container-narrow">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <p className="text-subheading mb-4">Privacy Policy</p>
          <h1 className="text-heading mb-8">プライバシーポリシー</h1>
          <div className="divider-line mb-12" />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="prose prose-invert max-w-none"
        >
          <div className="space-y-10 text-text-secondary">
            <section>
              <p className="leading-relaxed">
                MONË（以下「当サロン」といいます）は、お客様の個人情報の保護を重要な責務と考え、以下のとおりプライバシーポリシーを定め、個人情報の適切な取り扱いに努めます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">1. 個人情報の定義</h2>
              <p className="leading-relaxed">
                本ポリシーにおいて「個人情報」とは、生存する個人に関する情報であって、氏名、生年月日、住所、電話番号、メールアドレスその他の記述等により特定の個人を識別できるもの、および他の情報と容易に照合することができ、それにより特定の個人を識別できるものをいいます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">2. 収集する個人情報</h2>
              <p className="mb-2 leading-relaxed">当サロンは、以下の個人情報を収集することがあります。</p>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>氏名</li>
                <li>電話番号</li>
                <li>メールアドレス</li>
                <li>ご予約履歴・施術履歴</li>
                <li>その他サービス提供に必要な情報</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">3. 個人情報の利用目的</h2>
              <p className="mb-2 leading-relaxed">当サロンは、収集した個人情報を以下の目的で利用いたします。</p>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>ご予約の受付・確認・変更・キャンセルに関するご連絡</li>
                <li>施術サービスの提供</li>
                <li>アフターフォローのご連絡</li>
                <li>当サロンからのお知らせ・キャンペーン情報のご案内</li>
                <li>サービス向上のための分析・統計</li>
                <li>お問い合わせへの対応</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">4. 個人情報の第三者提供</h2>
              <p className="mb-2 leading-relaxed">
                当サロンは、以下の場合を除き、お客様の同意なく個人情報を第三者に提供することはありません。
              </p>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">5. 個人情報の管理</h2>
              <p className="leading-relaxed">
                当サロンは、お客様の個人情報を正確かつ最新の状態に保ち、個人情報への不正アクセス、紛失、破損、改ざん、漏洩などを防止するため、セキュリティシステムの維持、管理体制の整備、スタッフ教育の徹底等の必要な措置を講じ、安全対策を実施し個人情報の厳重な管理を行います。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">6. 個人情報の開示・訂正・削除</h2>
              <p className="leading-relaxed">
                お客様ご本人から個人情報の開示、訂正、削除のご依頼があった場合は、ご本人であることを確認の上、速やかに対応いたします。ご希望の場合は、下記のお問い合わせ先までご連絡ください。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">7. Cookieの使用について</h2>
              <p className="leading-relaxed">
                当サロンのウェブサイトでは、お客様の利便性向上のためCookie（クッキー）を使用することがあります。Cookieはお客様のブラウザに保存される小さなテキストファイルで、ウェブサイトの利用状況を分析し、サービスを改善するために使用されます。お客様はブラウザの設定によりCookieの受け入れを拒否することができますが、その場合、一部のサービスが正常に機能しない場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">8. アクセス解析ツールについて</h2>
              <p className="leading-relaxed">
                当サロンのウェブサイトでは、Google Analyticsなどのアクセス解析ツールを使用することがあります。これらのツールはCookieを使用してお客様のウェブサイト利用状況を収集しますが、個人を特定する情報は含まれません。収集されたデータはサービス改善のために使用されます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">9. 本ポリシーの変更</h2>
              <p className="leading-relaxed">
                当サロンは、必要に応じて本ポリシーを変更することがあります。変更後のポリシーは、当サロンのウェブサイトに掲載した時点から効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">10. お問い合わせ先</h2>
              <div className="glass-card p-6">
                <p className="text-text-primary font-serif text-lg mb-4">MONË（モネ）</p>
                <p className="leading-relaxed">
                  〒570-0036 大阪府守口市八雲中町1-24-1<br />
                  電話：06-6908-4859<br />
                  Instagram：@barber_shop0601mone
                </p>
              </div>
            </section>

            <div className="pt-8 border-t border-glass-border">
              <p className="text-sm text-text-muted">
                制定日：2025年12月13日<br />
                最終更新日：2025年12月13日
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
