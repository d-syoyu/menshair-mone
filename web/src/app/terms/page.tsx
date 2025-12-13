'use client';

import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container-narrow">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <p className="text-subheading mb-4">Terms of Service</p>
          <h1 className="text-heading mb-8">利用規約</h1>
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
              <h2 className="text-xl font-serif text-text-primary mb-4">第1条（適用）</h2>
              <p className="leading-relaxed">
                本規約は、MONË（以下「当サロン」といいます）が提供するすべてのサービス（以下「本サービス」といいます）の利用条件を定めるものです。お客様は、本規約に同意の上、本サービスをご利用いただくものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">第2条（会員登録）</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>Web予約システムをご利用いただくには、会員登録が必要です。</li>
                <li>会員登録時には、正確な情報をご入力ください。</li>
                <li>登録情報に変更が生じた場合は、速やかに変更手続きを行ってください。</li>
                <li>会員ID（メールアドレス）およびパスワードは、お客様ご自身の責任で適切に管理してください。</li>
                <li>会員資格の第三者への譲渡、貸与は禁止いたします。</li>
                <li>不正アクセスやなりすましによる損害について、当サロンは責任を負いません。</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">第3条（予約について）</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>当サロンは完全予約制となっております。</li>
                <li>予約は、電話、Web予約システム、またはInstagram DMにて承ります。</li>
                <li>予約の変更・キャンセルは、予約日の前日までにご連絡ください。</li>
                <li>当日キャンセルや無断キャンセルが続く場合、以降のご予約をお断りする場合がございます。</li>
                <li>ご予約時間に15分以上遅刻された場合、施術内容の変更またはキャンセルとさせていただく場合がございます。</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">第4条（施術について）</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>施術内容は、お客様の髪質・頭皮の状態により、ご希望に沿えない場合がございます。</li>
                <li>施術中に体調不良等が生じた場合は、直ちにスタッフにお申し出ください。</li>
                <li>施術後の仕上がりについてご不満がある場合は、1週間以内にご連絡ください。</li>
                <li>アレルギーや肌トラブルがある場合は、事前にお申し出ください。</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">第5条（料金・お支払い）</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>施術料金は、当サロンが定める料金表に基づきます。</li>
                <li>お支払いは、現金またはクレジットカードにて承ります。</li>
                <li>料金は予告なく変更する場合がございます。</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">第6条（禁止事項）</h2>
              <p className="mb-2 leading-relaxed">お客様は、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>他のお客様や当サロンスタッフに対する迷惑行為</li>
                <li>施設・設備の損壊行為</li>
                <li>酒気を帯びた状態でのご来店</li>
                <li>当サロン内での営業行為・勧誘行為</li>
                <li>虚偽の情報による会員登録</li>
                <li>第三者のアカウントの不正使用</li>
                <li>当サロンのシステムに対する不正アクセス</li>
                <li>その他、当サロンが不適切と判断する行為</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">第7条（退会）</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>会員は、当サロンが定める手続きにより、いつでも退会することができます。</li>
                <li>退会した場合、予約履歴等のデータは削除されます。</li>
                <li>当サロンは、会員が本規約に違反した場合、事前の通知なく会員資格を停止または削除することができます。</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">第8条（免責事項）</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>当サロン内での貴重品の紛失・盗難について、当サロンは責任を負いません。</li>
                <li>施術に起因するトラブルについては、誠意をもって対応いたしますが、お客様の体質・体調に起因するものについては責任を負いかねます。</li>
                <li>天災等の不可抗力により予約をキャンセルさせていただく場合がございます。</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">第9条（個人情報の取り扱い）</h2>
              <p className="leading-relaxed">
                当サロンは、お客様の個人情報を「プライバシーポリシー」に基づき適切に取り扱います。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">第10条（規約の変更）</h2>
              <p className="leading-relaxed">
                当サロンは、必要と判断した場合には、お客様に通知することなく本規約を変更することができるものとします。変更後の規約は、当サロンのウェブサイトに掲載した時点から効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-text-primary mb-4">第11条（準拠法・管轄裁判所）</h2>
              <p className="leading-relaxed">
                本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、大阪地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
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
