# SB連携をMONËから同じVPSで使う前のセキュリティ監査（2026-11-12）

対象：SOGA（`C:\Users\User\homepage`、master `b333d81ba`）のSB連携一式と、MONË（このリポジトリ `web/`、master `b0705df`）の管理者認証・`/api/admin/**`。コードと設定ファイルを読んだ範囲の監査で、VPSの実機・本番DB・Vercelの設定は見ていない。

## 0. 結論

- **SOGA単体のSB連携は、よく守られている。** 致命的な穴は見つからなかった（4章）。
- **ただし、今のVPSの作りは「1台のVPSを1つのサービス（SOGA）が使う」前提で固められている。** MONËが2つ目のサービスとして同じVPSに乗ると、作り方しだいで、**MONË側の侵害が、SOGAの全店舗のSBのログイン状態とパスワードに届く**（1章の S-1〜S-3、深刻度「高」）。
- MONËの管理画面は、**SBを操作できる入口としては認証が弱い**（2章の M-1・M-2、深刻度「中〜高」）。
- **MONËのSBアカウント（`H000456371`）は、2026-10-22〜10-31にSOGAの試験店舗としてVPSに載せたことがある**（SOGA `docs/reviews/salonboard-cloud-required-changes-result-2026-10-22.md:57,71`、`docs/reviews/salonboard-preview-trials-2026-10-31.md:735`）。そのプロファイルが今も残っていれば、そこにMONËのSBパスワードとログイン状態がある。MONËから別の連携を作ると、同じSBアカウントを2つの仕組みが書き換えることになる。

このため、**実装の前にユーザーの判断が必要な点がある**（5章）。

---

## 1. 同じVPSを2つのサービスで共有することで新しく生まれる危険

| ID | 深刻度 | 内容 | 根拠 |
| --- | --- | --- | --- |
| S-1 | **高** | **Chromeのポリシーはマシン全体に効く。** `/etc/opt/chrome/policies/managed/soga-sb.json` は、すべてのOSユーザー・すべてのプロファイルに「SOGAの拡張だけを強制インストール、ほかは全部禁止」を課す。MONËの拡張を入れるためにこの一覧へ足すと、**MONËの拡張がSOGAの全店舗のプロファイルにも強制で入り**、`salonboard.com` への権限を持つ。MONËの拡張の更新元（MONËのVercel）か署名鍵が奪われれば、全店舗のSB画面・Cookie・保存パスワードを読む更新を配れる。 | SOGA `hosts/salonboard/install-extension-policy.sh:22-31`（`ExtensionInstallForcelist`・`"*": blocked`）、`extensions/salonboard-reader/manifest.json:9` |
| S-2 | **高** | **全店舗のChromeとホストの鍵は、1つのOSユーザー（`sbtrial`）が持つ。** MONËの常駐プログラムやChromeを同じユーザーで動かすと、SOGAのホスト鍵（`~/.config/soga-sb-agent/token`）と全プロファイル（SBパスワードの暗号文とその鍵、Cookie）をそのまま読める。 | SOGA `hosts/salonboard/install-agent.sh:19-31`、`soga-sb-agent.py:29-34`、`extensions/salonboard-reader/src/credential-vault.ts:49-50`（「このプロファイルを操れる者は使える」とコード自身が明記）、`docs/architecture/salonboard-host-intrusion.md:9-12` |
| S-3 | **中** | **画像認証の画面共有は、パスワードなしのVNCをVPS内（127.0.0.1）で開く。** 共有中、VPS内の別ユーザー（MONË用のユーザーを作った場合はそのユーザー）が中継より先にそのポートへつなげば、その店舗のSB画面を見て操作できる。今は「VPSにはSOGAしかいない」前提で成り立っている。 | SOGA `hosts/salonboard/sb-captcha-share.py:252-255`（`-localhost -once -nopw`） |
| S-4 | 中 | **SSHは `ubuntu` の鍵1本、ディスクは暗号化なし。** MONËの運用でVPSに入る人・鍵が増えると、そのままSOGAの全店舗に届く。今は運用者が1人なので成り立つ。 | SOGA `hosts/salonboard/harden-host.sh:9-20`、`docs/architecture/salonboard-host-intrusion.md:45-49` |
| S-5 | 中 | **侵入時の「切り離す」はSOGAの運営画面にしかない。** MONËの店舗が同じVPSにいても、SOGAの「侵入の疑い：切り離す」はMONËの接続を止めない。逆も同じ。片方だけ止めて、もう片方の鍵がVPSに残る。 | SOGA `docs/architecture/salonboard-host-intrusion.md:32-43`、`src/lib/salonboard-onboarding.ts:80-97` |
| S-6 | 中 | **同じSBアカウントを2つの仕組みが書く。** MONËのSB（`H000456371`）がSOGAの試験店舗として残っていると、SOGAとMONËの両方がSBへ予約を書き、相手の書き込みを「SB側で直接入った予約」として読む。二重予約や取り消しの取り違えが起きうる。 | SOGA `docs/reviews/salonboard-preview-trials-2026-10-31.md:735` |
| S-7 | 低 | メモリ。1店舗0.13〜0.25GB増える。Chromeを2つ動かすと、それぞれ約0.6GBの基本分がかかる。 | SOGA `hosts/salonboard/sb-chrome-start:6-9` |

### 共有のしかた別の評価

| 案 | VPSの変更 | S-1 | S-2 | S-3 | 手間 |
| --- | --- | --- | --- | --- | --- |
| **A. MONËをSOGAの1店舗（テナント）にし、MONËはSOGAとサーバー同士で予約枠をやり取りする** | なし | 起きない | 起きない | 起きない | SOGA側にテナント外向けAPI（店舗ごとの鍵）が要る。MONË側は小さい |
| B. MONE用の拡張・常駐プログラムを、同じOSユーザーで動かす | ポリシー追記 | **起きる** | **起きる** | 起きる | 大（SOGAの約130ファイルを移植） |
| C. MONË用に別のOSユーザー・別のブラウザ（例：ポリシーの置き場が別のChromium）で動かす | 大きい（ユーザー、ブラウザ、ポリシー、VNCのパスワード化、SSH） | 避けられる | 避けられる | VNCにパスワードかUNIXソケットが要る | 大＋VPSの作業 |
| D. MONË用に別のVPS | 新しいVPS | 起きない | 起きない | 起きない | 大＋VPS代 |

**推奨は案A。** VPSに新しい信頼先を足さず、VPSは引き続きSOGAだけを信じる。MONËが侵害されても、届くのは「SOGAの中のMONËの店舗」に渡した鍵の範囲だけになる。ただしSOGA側の変更が要るので、SOGAの作業として分けて提案する（このセッションではSOGAを書き換えない）。

---

## 2. MONËの管理画面・API（連携の入口）

| ID | 深刻度 | 内容 | 根拠 | 直し方 |
| --- | --- | --- | --- | --- |
| M-1 | **高（SB連携を載せる場合）** | **管理者のメールアドレス宛てのログインリンク（Resend）で、パスワードなしに管理者になれる。** メールでのログインは、DBの利用者をそのまま返すので、`role: ADMIN` がJWTに入る。管理者の「メール＋パスワード」は、実際には「メールを読めること」だけで破れる。 | `web/src/lib/auth.ts:133-155`（Resend）、`:197-203`（`user.role` をそのまま採用） | `jwt` コールバックで、`account.provider !== "credentials"` のときは `ADMIN` を与えない（`CUSTOMER` に落とすか、サインインを拒む）。`signIn` コールバックで、管理者のメールにはメールリンク・LINEを使わせない |
| M-2 | 中 | **管理者のパスワードログインに回数制限がない。** 総当たりを止めるものがない。MONËにはRedis等の仕組みもない。 | `web/src/lib/auth.ts:158-193`、管理者ログインの独自API `web/src/app/api/auth/admin-login/route.ts:11-41`（回数制限・CSRF確認なし、存在しないメールではbcryptを回さないので応答時間で登録の有無が分かる）、`web/package.json`（rate limit用の依存なし） | Upstash Redis（SOGAと同じ方式）で、メールとIPごとに失敗回数を制限する。可能なら管理者に2段階認証 |
| M-3 | 中 | **権限はJWTに90日間焼き込まれ、DBを見直さない。** 管理者を外しても、パスワードを変えても、発行済みのセッションは最長90日そのまま使える。取り消す手段もない。 | `web/src/lib/auth.ts:113-119`、`:197-222`、`web/src/proxy.ts:350-358` | SB連携の操作（接続・停止・パスワードの受け渡し）だけは、その場でDBの `role` と「セッション発行後にパスワードを変えていないか」を確かめる。管理者のセッションは短くする |
| M-4 | 低 | `/api/admin/**` は全ルートで `ADMIN` を確かめている（`checkAdminAuth` か `auth()` の直接確認）。proxyも403を返す。 | `web/src/proxy.ts:372-400`、各 `route.ts` | 問題なし。新しいSBのルートも同じ形にする |
| M-5 | 低（範囲外） | リマインダーのcronは `CRON_SECRET` が未設定だと誰でも動かせ、秘密をURLのクエリでも受ける（ログに残る）。 | `web/src/app/api/cron/send-reminders/route.ts:16-29` | 未設定なら拒む。クエリでの受け付けをやめる。SB連携とは別に直す |
| M-6 | 低 | 初期データの管理者パスワードが既定値 `admin123`。 | `web/prisma/seed.ts:157-158` | 環境変数がないときは種まきを止める |

---

## 3. SOGAのSB連携そのもの（テナント分離・ログ）

**別テナントの予約・顧客・SBの資格情報・ジョブに、拡張やホストの鍵で届く経路は見つからなかった。** テナントは、サーバーがHMACで署名した接続の鍵の中身だけで決まる。リクエストの本文やクエリの `tenantId`・`shopId` は使っていない（`src/lib/salonboard-extension.ts:62-77,266-277`）。署名に加えて、Redisにある今の接続とも照合する（`:191-192,424-431`）。ジョブの取り出し・報告は、テナント・接続・店舗で絞る（`src/lib/salonboard-write-attempt-service.ts:84-88,280-290,431`）。

| ID | 深刻度 | 内容 | 根拠 | 直し方 |
| --- | --- | --- | --- | --- |
| G-1 | 中 | 拡張から上がる診断ログは、中身を検査せずにRedisに7日間置かれる。機密を除くのは拡張側の許可リストだけ。古い版・改造版、漏れた鍵からは、任意のデータ（最大768KB）を置ける。運営はそれをダウンロードして開く。 | `src/lib/salonboard-diagnostics.ts:22-25,90-98`、`extensions/salonboard-reader/src/diagnostic-log.ts:5-23` | 拡張と同じ許可リストをサーバー側でも当てる |
| G-2 | 低 | 書き込みの記録に、お客様の名前（SBのメモ欄）が平文で残り続ける。 | `src/lib/salonboard-sync.ts:38-44`、`salonboard-write-attempt-store.ts:235` | 終わった試行のメモを一定期間で消す |
| G-3 | 低 | ペアリングコードの旧形式（平文）を、そのまま受け付けて返す。 | `src/lib/salonboard-pairing-code-box.ts:26` | 旧形式の行を消して、この分岐を削る |
| G-4 | 低 | ホストが返すエラーの文字列（200字まで自由文）を、DBに保存してメールに載せる。 | `src/lib/salonboard-onboarding.ts:150,216,241-242` | `^[A-Z_]{1,40}$` に限る |
| G-5 | 低 | `SalonboardConnection.externalShopId` にDBの一意制約がない（アプリ側の確認だけ）。 | `prisma/schema.prisma:1601` | 一意インデックスを足す |
| G-6 | 低 | 呼び出し元ごとの回数制限は、Redisの障害時に制限なしになる（鍵は256bitで、総当たりは現実的でない）。 | `src/lib/salonboard-caller-limit.ts:12` | DBの負荷対策として `closed` を検討 |

**共有で特に守ること（S-8、高）：** 接続の鍵を署名する `SALONBOARD_EXTENSION_SECRET`、画像認証の中継の `SALONBOARD_CAPTCHA_RELAY_SECRET`、接続の照合に使うRedisを、MONËと共用してはいけない。共用すると、MONËの環境変数が漏れただけで、SOGAのどのテナントの接続の鍵でも作れる。移植するときも、鍵・Redis・拡張の署名鍵・拡張IDはすべてMONË専用にする。

---

## 4. SOGAで問題なしと確認した点

- **VPSの常駐プログラムとSOGAの間：** ホスト鍵は32バイトの乱数、SOGAは SHA-256 のハッシュだけを持つ（`src/lib/salonboard-onboarding.ts:27-28,46-47,191-192`）。鍵ファイルは 600 でないと起動しない（`soga-sb-agent.py:62-64`）。リダイレクトで鍵を他所へ送らない（`:381-390`）。SOGAからの指示はプロファイル名・コードを正規表現で縛り、`setupId` と一致しない名前は拒む（`:154-159,425`）。削除はパスの実体を確かめてから（`:261-265`）。チケットはコマンドラインでなく標準入力で渡す（`:222-224`）。
- **SBのID・パスワード：** オーナーのブラウザで拡張の公開鍵（RSA-OAEP-2048＋AES-GCM）に封をして送り、SOGAは開けない（`src/lib/salonboard-credential-box.ts:1-3,41-52`）。拡張は取り出せないAES鍵で暗号化してIndexedDBに置く（`extensions/salonboard-reader/src/credential-vault.ts:49-60`）。ペアリングコードはDBで暗号化（`src/lib/salonboard-pairing-code-box.ts`）。
- **拡張とSOGA：** 宛先はビルド時に固定、ページのメッセージで変えられない（`extensions/salonboard-reader/src/soga-origin.ts:1-3`、`src/lib/salonboard-extension-bridge.ts:3-5`）。管理画面との橋渡しは、SOGAの接続ページ・同じウィンドウ・同じオリジンに限り、鍵もSBのパスワードも渡さない（`extensions/salonboard-reader/src/admin-bridge.ts:4-16`）。
- **拡張の配布：** CRX3で署名し、署名鍵はリリース用PCだけ（`extensions/salonboard-reader/crx3.mjs:2`、`.gitignore` の `*.pem`）。
- **エラー応答：** 例外・本文・鍵・URLを返さない（`src/lib/salonboard-extension-http.ts:51-56`）。常駐プログラムのログはエラーの種類だけ（`soga-sb-agent.py:433-449`）。
- **VPSの公開範囲（コードと手順書から）：** SSHは鍵のみ・`ubuntu` のみ・逆トンネル不可、ログインはSOGAへ報告（`harden-host.sh`）。xrdpは127.0.0.1のみ（`docs/reviews/salonboard-domestic-vps-trial-plan-2026-10-22.md:89,93`）。ファイアウォールは22番だけ（`docs/architecture/salonboard-host-intrusion.md:22`、手順書の記述で、実機は未確認）。Chromeは同期・パスワード保存・DevTools・`file://`・ダウンロードを禁止（`install-extension-policy.sh:22-31`）。
- **Neonの5分ルール：** ホストの30秒ごとの問い合わせは、Redisの関門で答え、DBへ行かない（`src/app/api/salonboard/host/poll/route.ts:28-29`、`src/lib/salonboard-host-poll-gate.ts`）。

---

## 5. ユーザーの判断を待つ点

1. **共有のしかた：** 案A（MONËはSOGAの1店舗。VPSは変えない）で進めるか。B〜Dにするか。
   - 案Aにする場合、SOGA側に「外部サービス（MONË）向けの店舗ごとのAPI」を作る作業が必要。SOGAの作業として別に提案する。
   - 案B・Cの場合は、S-1・S-2を避けるためのVPSの変更（別ユーザー、別ブラウザ、ポリシーの分離、VNCのパスワード化）を先に了承してもらう必要がある。
2. **MONËのSBアカウント（`H000456371`）が、今もSOGAのVPSに試験店舗として載っているか。** 載っていれば、案A以外では先に外す必要がある（S-6）。
3. **M-1（メールリンクで管理者になれる）を先に直してよいか。** SB連携と関係なく直すべきで、小さい変更。
