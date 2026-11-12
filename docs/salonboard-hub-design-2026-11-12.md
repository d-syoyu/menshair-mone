# SB連携の共通窓口（SOGAハブ）設計（2026-11-12）

[セキュリティ監査](salonboard-shared-vps-security-audit-2026-11-12.md)の結論を受けた設計。前提は次の3つ（2026-11-12、ユーザー確認済み）。

- SB連携は、MONËに限らず、今後いろいろなプロジェクトで使う。
- VPSは、SB連携を使うプロジェクト・店舗に応じて増やす。
- 共有のしかたは案A：VPSはSOGAだけを信じ、各プロジェクトはSOGAを窓口にしてSBとつなぐ。

**この文書は提案で、SOGAのリポジトリはまだ変えていない。** SOGA側の作業（4章）は、SOGAの作業として別に進める。

---

## 1. 全体の形

```
 お客様・オーナー                    プロジェクト（MONËなど）            SOGA（窓口）                    VPS（プールごと）
 ─────────────                    ───────────────────            ──────────────                 ─────────────
 予約画面を開く ───────────────▶  空き枠を出す ──[占有を問う]────▶  SBの占有（Redis／読取から。DBに触らない）
                                  ──[読み直しを頼む]──────────▶  読取を起こす（Redis） ─────────▶  Chrome＋拡張がSBを読む
 予約を確定する ───────────────▶  自分のDBに予約 ──[枠を押さえる]──▶  外部予約＋占有を保存（DB）
                                                                  書込の試行 ───────────────────▶  SBへ手入力予約を登録・読み戻し
                                  ◀──[Webhook：反映済み／要確認]──  結果を保存（DB）
 オーナーの初期設定・画像認証 ─────────────────────────────────▶  SOGAの管理画面（SBのパスワードは拡張の公開鍵で封）
```

- **VPSが話す相手はSOGAだけ。** 拡張・常駐プログラム・Chromeのポリシーは今のまま。プロジェクトはVPSに直接触らない（監査のS-1〜S-3、S-8が起きない）。
- **プロジェクトの予約の正本は、プロジェクトのDB。** SOGAは「SBの枠を押さえる・変える・放す」と「SBの占有を答える」だけを受け持つ。お客様・メニュー・会計はSOGAに渡さない。
- **SBのパスワードを入れる場所は、SOGAの管理画面だけ。** プロジェクトごとに作らない。

## 2. 決めること（判断の記録）

| 論点 | 決め | 理由 |
| --- | --- | --- |
| APIの単位 | **SBの枠**（店舗・担当・日時・状態）。SOGAの予約の形にしない | プロジェクトごとに予約の作りが違う。後でSB連携をSOGAから切り出しても、APIが変わらない |
| SOGAの中での持ち方 | **新しい「外部予約」（`SalonboardExternalBooking`）を作る**。SOGAの通常の予約（`Reservation`）には入れない | SOGA自身の文書が、通常の予約を作ると架空の顧客・通知・会計などに誤って流れると書いている（SOGA `docs/architecture/salonboard-inbound-reservations.md` 「なぜ予約状態を作らないか」）。書込の試行と同期の行は、今は `reservationId` に結び付いている（SOGA `prisma/schema.prisma:1769,1816`）ので、対象を「予約か外部予約」に広げる |
| 二重予約を防ぐ場所 | **SOGAが枠を押さえる時に判定する**。プロジェクトはそれが通ってからお客様に確定を返す | SOGAの二重予約の防止は、確定と同じトランザクションで占有（`SalonboardReservationGuard`）を取る作り（SOGA `docs/architecture/salonboard-reservation-guards.md`）。外部予約も同じ占有の表に入れれば、SOGA自身の予約・他のプロジェクトの予約と同じ判定になる |
| SBの占有の読み方 | **SOGAの今の「生の占有」をそのまま返す**。DBに保存しない | SOGAは、SBの占有を読取からその場で読み、DBに置かない（SOGA `src/lib/salonboard-live.ts:6-11`）。Neonを起こさない |
| SOGAからプロジェクトへの知らせ | **署名付きのWebhook**。プロジェクトに定期的に問い合わせさせない | プロジェクトの数だけDBが起き続けるのを避ける（Neonの5分ルール） |
| Webhookの再送 | **キュー（Vercel Queues か QStash）の遅延配送**。DBの送信待ちの表をcronで見回らない | cronで見回ると、何もないときもDBが起きる |
| 店舗をどのVPSに載せるか | **ホストの区分け（プール）**。店舗は、自分のプールのホストにだけ載る | 今は空きのあるホストが来た順に、どの店舗でも受け取る（SOGA `src/lib/salonboard-onboarding.ts:259-269`）。これではVPSを分けても、侵入されたときの被害の範囲がプロジェクトの境目と一致しない |

## 3. 共通API（SOGA側）

パスは `https://admin.soga.ltd/api/salonboard/hub/v1/...`（SOGAの管理用ホストだけで受ける。拡張の受け口と同じ確かめ方、`extensionHostAllowed`）。

### 3-1. 鍵と範囲

- **利用者（`SalonboardHubClient`）＝プロジェクト1つ。** 例：`mone`。
- **鍵は利用者ごと、届く範囲は店舗ごと。** 鍵には、使える店舗（SOGAの `shopId`）と操作（`occupancy:read` `bookings:write` `read-demand`）を結び付ける。
- 鍵の形：`sbh_<鍵ID 12文字>_<秘密 43文字>`。SOGAは鍵IDと秘密のSHA-256だけを持つ。照合は鍵IDで1行引いて、`timingSafeEqual` で比べる。
- **有効な鍵は1利用者に2本まで**（入れ替えの間だけ2本）。発行・失効は運営画面から行い、操作の記録（`opsAuditLog`）に残す。
- 回数の制限：鍵ごと・店舗ごとにRedisで数える。**書き込みは、Redisの障害時に止める**（`failureMode: 'closed'`）。読み取りは、障害時も通す。
- 応答は、SOGAの拡張の受け口と同じく、エラーの種類だけを返す。例外・本文・鍵・URLは返さない（SOGA `src/lib/salonboard-extension-http.ts:51-56` と同じ方針）。

### 3-2. エンドポイント

| メソッドとパス | 用途 | DB | 備考 |
| --- | --- | --- | --- |
| `GET /shops/{shopId}/status` | 連携の状態（つながっている／ログイン切れ／画像認証待ち／読取が古い／停止中）と、SOGAの設定画面のURL | 読む（Redisの答えを先に使う） | プロジェクトの管理画面が開かれたときだけ呼ぶ。定期的には呼ばない |
| `GET /shops/{shopId}/occupancy?from=YYYY-MM-DD&to=YYYY-MM-DD` | SB側の占有（担当ごとの埋まっている区間、フリー枠の数）と、いつの読取か（`observedAt`）、その日を出してよいか（`open: true/false`） | 触らない（読取とRedisから） | 範囲は最大14日。読取が古い・欠けている日は `open: false`（SOGAの「分からない日は閉じる」と同じ） |
| `POST /shops/{shopId}/read-demand` | お客様が日付を見ている。その日を優先して読み直してほしい | 触らない（Redis） | SOGAの公開予約ページの `read-demand` と同じ処理（SOGA `src/app/api/storefront/shops/[shopSlug]/read-demand/route.ts`）。お客様の操作のときだけ送る。**定期的に送らない**（SOGA `SalonboardInboundReservations.tsx:63` の300秒ごとの送信は真似しない） |
| `GET /shops/{shopId}/staff` | SBのスタッフと、プロジェクトの担当との対応 | 読む | 対応づけはSOGAの設定画面で行う（名前で推測しない） |
| `PUT /shops/{shopId}/bookings/{externalId}` | 枠を押さえる・変える。本文：版（`version`）、担当（プロジェクトの担当ID）、日付、開始・終了、状態（`ACTIVE`）、SBのメモに書く名前、受け口（`PUBLIC`＝お客様の予約／`ADMIN`＝店舗の管理画面から） | 書く | 冪等。同じ `externalId` と `version` の再送は、同じ答えを返す。答えは3-2-1 |
| `DELETE /shops/{shopId}/bookings/{externalId}?version=n` | 取り消し | 書く | 占有は、SBでの取り消しを確かめるまで残す（SOGAの今の規則） |
| `GET /shops/{shopId}/bookings/{externalId}` | 今の同期の状態（`PENDING` `APPLIED` `VERIFY_REQUIRED` `MANUAL_REQUIRED`） | 読む | Webhookを取りこぼしたときの確認用。定期的には呼ばない |
| `POST /shops/{shopId}/setup-link` | SOGAのSB設定画面に入る一度きりのリンク（3-4） | 書く（リンクの記録） | プロジェクトの管理者がボタンを押した時だけ。答え：`{ url, expiresAt }` |

### 3-2-1. 枠を押さえる時の答え（SOGAの店舗と同じ規則）

**外部の予約も、SOGA自身の店舗の予約と同じ規則で受ける**（SOGA `docs/architecture/salonboard-request-confirmation-design.md` 「現行方針（2026-10-31更新）」）。判定はSOGAのサーバーが行い、プロジェクトは方式を選べない。

| SBの状態 | SOGAがすること | 答え | プロジェクトがお客様に返すもの |
| --- | --- | --- | --- |
| 新しく完全な読取で空き | その場で占有を取る | `CONFIRMED` | 予約の確定 |
| 読取が古い・足りない | 優先読取を起こし、約20秒まで待つ。空きを確かめられたら占有を取る | `CONFIRMED` | 予約の確定 |
| 待っても確かめられない | 申込として受け、SBに書いて照合できてから確定する | `REQUESTED` | 「申込を受け付けました。確定したらお知らせします」。結果は `booking.state_changed` で届く |
| 新しく完全な読取で埋まっている | 受けない | `CONFLICT` | 「その時間は埋まりました」 |
| 書込の停止・受付の停止・接続の停止・画像認証待ちなど、分かっている停止 | 受けない。申込にも回さない | `PAUSED` | 「ただいまWeb予約を停止しています。お店にご連絡ください」 |
| 受け口が `ADMIN` | 停止中でも確定する（店舗の中の重複・担当・営業時間の確認は行う） | `CONFIRMED` | ― |

- 20秒の待ちは、SOGA側でDBのトランザクションを開かずに行う（SOGAの今の作りと同じ）。プロジェクト側の呼び出しの時間切れは、30秒以上にする。
- `CONFIRMED` はSBへの書込が済んだという意味ではない。読取から書込までの間にSB側で入った予約と重なることがあり、その時は `booking.state_changed`（`VERIFY_REQUIRED`）で知らせる。自動で取り消さない（SOGAと同じ）。
- **SOGAそのものに届かない時は、受けない。** SOGAの店舗では、SOGAが止まれば予約画面ごと止まる。それに合わせ、プロジェクトは「ただいまWeb予約を受け付けられません。お店にご連絡ください」と出す（2026-11-12、ユーザーの指示で決定）。

**SOGAに渡すお客様の情報は、SBのメモに書く名前だけ**（SOGAの `salonboardNote` と同じ60文字以内）。電話・メール・メニュー・金額は渡さない。終わった外部予約の名前は、一定期間（例：90日）で消す（監査のG-2）。

### 3-3. Webhook（SOGA → プロジェクト）

- 宛先は利用者ごとに1つ、`https://` だけ。運営画面で登録する。リダイレクトは追わない。
- 署名：`X-Sb-Hub-Signature: t=<秒>,v1=<HMAC-SHA256(秘密, t + "." + 本文)>`。秘密は利用者ごと。署名するためにSOGAが平文を持つ必要があるので、DBには暗号化して置く（SOGAのペアリングコードの箱と同じ方式。鍵は専用の環境変数）。受け手は、5分より古い `t` を拒み、イベントIDで重複を除く。
- イベント：

| イベント | いつ | 本文 |
| --- | --- | --- |
| `booking.state_changed` | 外部予約の同期の状態が変わった（反映済み・要確認・手作業が必要） | `externalId`、`version`、`state`、SBの予約番号 |
| `booking.changed_in_sb` | プロジェクトから書いたSBの予約が、SB上で手で変えられた・消された | `externalId`、SBで見えた日時・担当／消えた |
| `shop.status_changed` | 連携の状態が変わった（ログイン切れ、画像認証待ち、停止、再開） | 状態と、SOGAの設定画面のURL |
| `occupancy.changed` | SB側の占有が変わった日（SB側で直接入った予約など） | 日付の一覧だけ（中身は `occupancy` で取りに行く） |

- 送り方：イベントが起きたときだけ、キューに積んで送る。失敗したら、キューの遅延配送で、1分・5分・30分・2時間・12時間後に送り直し、それでも失敗したら運営にメールする。**何もないときに、DBを見回る処理は作らない。**
- `occupancy.changed` は、SOGAが読取の差分をDBに保存した時（何かが変わった時だけ、SOGA `docs/architecture/salonboard-inbound-reservations.md` 「RedisとDB」）に出す。

### 3-4. SOGAのSB設定画面への一度きりのリンク（2026-11-13に追加）

SBの初期設定（同意・SBのID・パスワード・画像認証・店舗番号の確認・スタッフの対応づけ・スイッチ）は、SOGAの画面で行う。SBのパスワードを扱う画面を、SOGAの1か所だけに置くためである。プロジェクトの管理画面には「SBの設定を開く」ボタンを置き、SOGAに別にログインしなくても、その店舗のSB設定画面が開くようにする（ユーザーの決定）。

- **出し方**：プロジェクトのサーバーが、鍵（操作 `setup-link`）で `POST /shops/{shopId}/setup-link` を呼ぶ。本文は `{ actor }`（プロジェクト側の管理者のメールアドレス。記録のためだけ）。SOGAは `{ url, expiresAt }` を返す。プロジェクトは、その管理者のブラウザで `url` を開く。
- **リンク**：`https://admin.soga.ltd/salonboard-link/<秘密 43文字>`。SOGAは秘密のSHA-256だけを持つ。**有効は5分、使えるのは1回だけ。** 使った時・時間が切れた時に消す。
- **入った後に届く範囲**：その店舗のSB設定画面と、そこからの操作だけ。テナントの他の画面（予約・顧客・会計・他の店舗）には入れない。ログインの長さは30分で、延ばさない。画面に「MONËの管理画面から入っています」と出す。
- **記録**：リンクを出した時・使った時・その中での操作を、`opsAuditLog` に残す（利用者・店舗・`actor`）。
- **守り**：リンクを出せるのは、鍵の範囲にその店舗と `setup-link` がある時だけ。回数の制限は鍵ごとに1分5回で、Redisの障害時は出さない。プロジェクト側でも、管理者のログインが新しい時（12時間以内、MONËの `adminTokenFresh`）だけボタンを使えるようにする。
- **危険の変わり方**：プロジェクトの管理画面を奪われると、そのプロジェクトの店舗のSB設定まで届く。そのため、プロジェクトの管理画面には、回数の制限・ログインの取り消しなど、SOGAの運営画面に近い守りが要る。MONËは監査のM-2・M-3で入れた（PR #20）。2段階認証は、MONËの管理画面にはまだない。

## 4. SOGA側で必要な作業

| # | 作業 | 大きさ |
| --- | --- | --- |
| H-0 | `demo-salon` に残っている、MONËのSB店舗（`H000456371`）との接続の記録を、運営の操作で消す（6章の2） | 小 |
| H-1 | **ホストのプール**：`SalonboardHostPool` を足す。`SalonboardHost.poolId` と、店舗（またはテナント）の `salonboardHostPoolId` を持たせる。`assignWaitingSetups` の条件にプールの一致を加える。既存のホストと店舗は既定のプール `soga` に入れる | 小 |
| H-2 | **利用者と鍵**：`SalonboardHubClient`、`SalonboardHubKey`（鍵IDとハッシュ、範囲、失効日）、運営画面での発行・失効 | 中 |
| H-3 | **外部予約**：`SalonboardExternalBooking`（`clientId`、`tenantId`、`shopId`、`externalId`、`version`、状態、担当、日時、メモの名前）。占有の表と書込の試行の対象を「予約か外部予約」に広げる | **大**（SBへの書込の中心部分に手を入れる） |
| H-4 | **APIの受け口**（3-2） | 中 |
| H-5 | **Webhook**：イベントの記録、署名、キューでの配送と再送、宛先の登録 | 中 |
| H-6 | **運営画面のログインの強化**（2段階認証）。窓口になると、SOGAの運営画面が奪われたときに、全プロジェクト・全VPSに届くため | 中 |
| H-7 | 監査で見つかった小さな直し：診断ログをサーバー側でも検査する（G-1）、終わった記録の名前を消す（G-2）、ペアリングコードの旧形式を消す（G-3）、ホストのエラーの文字を絞る（G-4）、`externalShopId` に一意の制約を付ける（G-5） | 小 |
| H-8 | **設定画面への一度きりのリンク**（3-4）：`setup-link` の受け口、リンクで入った時の範囲を絞ったログイン、操作の記録 | 小〜中 |

**テナントの持ち方：** プロジェクトの店舗ごとに、SOGAのテナントと店舗を1つずつ作る（例：テナント「MONË」・店舗「men's hair MONE」）。オーナーは、そのテナントのオーナーとしてSOGAの管理画面に入り、SBの初期設定・スタッフの対応づけ・画像認証を行う。SOGAの利用権・プランの扱いは未確認（6章）。

## 5. MONË側で必要な作業

### 5-1. 環境変数

| 名前 | 中身 |
| --- | --- |
| `SB_HUB_URL` | `https://admin.soga.ltd/api/salonboard/hub/v1` |
| `SB_HUB_API_KEY` | SOGAの運営画面で発行したMONËの鍵（Vercelの環境変数だけに置く。コード・ログに出さない） |
| `SB_HUB_SHOP_ID` | SOGAでのMONËの店舗ID |
| `SB_HUB_WEBHOOK_SECRET` | Webhookの署名の秘密 |

SOGAの `SALONBOARD_EXTENSION_SECRET`、SOGAのRedisの接続先、画像認証の中継の秘密は、**MONËに置かない**（監査のS-8）。

### 5-2. スキーマ（Prisma）

- `Reservation` に `sbState`（`NONE` `PENDING` `APPLIED` `VERIFY_REQUIRED` `MANUAL_REQUIRED`、既定 `NONE`）、`sbVersion`（整数、既定0）、`sbReservationNo`（文字列、任意）を足す。
- `SbHubEvent`（受け取ったWebhookのイベントID・種類・受け取り時刻）を足す。重複を除くためだけに使い、本文は保存しない。
- `User`（スタッフ）またはスタッフの設定に、SOGAの担当IDとの対応を置く。MONËはスタッフ1名なので、最初は環境変数1つ（`SB_HUB_STAFF_ID`）でもよい。

**マイグレーションの手順：**
1. `web/prisma/migrations/` に、列と表を足すだけのSQLを作る（既存の列は消さない・変えない）。
2. Neonの開発用ブランチで `npx prisma migrate deploy` を流し、プレビューで動きを確かめる。
3. 本番は、Vercelのデプロイの前に `npx prisma migrate deploy` を手で流す（列の追加だけなので、古いコードが動いたままでも壊れない）。
4. 本番DBへの書き込みは、ユーザーが行う（このセッションでは行わない）。

### 5-3. 予約の流れ

1. **空き枠を出す時**：MONËの今の空き枠の計算に、`occupancy` で取ったSBの占有を重ねる。`open: false` の日は、その日の予約を受けない。結果はMONËの側で15秒だけ覚え、同じ画面の再表示で何度も聞かない。
2. **お客様が日付を選んだ時**：`read-demand` を送る（ページを開いた時と日付を変えた時だけ）。
3. **確定する時**：MONËのDBに予約を `sbState: PENDING` で作り、`PUT bookings/{予約ID}` を呼ぶ（時間切れは30秒）。答えごとの扱いは3-2-1のとおり。
   - `CONFIRMED`：お客様に確定を返す。
   - `REQUESTED`：MONËの予約は「申込」として残し、お客様には確定待ちを返す。確定・不成立は `booking.state_changed` で受けて、お客様にメールする。MONËはオンライン決済がないので、SOGAのような与信・売上確定の処理は要らない。
   - `CONFLICT`・`PAUSED`：MONËの予約を取り消し、それぞれの文言を返す。
   - SOGAに届かない・時間切れ：MONËの予約を取り消し、「ただいまWeb予約を受け付けられません。お店にご連絡ください」と返す。
   - MONËの管理画面からの予約は、受け口を `ADMIN` にして送る。
4. **変更・取り消し**：MONËで変えたら、版を1つ上げて `PUT`／`DELETE` を呼ぶ。
5. **Webhookを受けた時**（`/api/sb-hub/webhook`）：署名と時刻を確かめ、イベントIDで重複を除き、該当する予約の `sbState` を更新する。`booking.changed_in_sb` は、管理画面の「要確認」に出す（MONËの予約を自動で変えない・消さない。SOGAの今の規則と同じ）。

### 5-4. 管理画面

- 予約の一覧・詳細に、SBへの反映の状態を出す。
- 「SB連携」の欄：連携の状態（`status` を画面を開いた時だけ取る）、要確認の予約、SOGAの設定画面へのリンク。**定期的に読み直さない**（SOGAの設定画面の30秒ごとの読み直し、SOGA `salonboardSettingsData.ts:43`・`SalonboardCloudClient.tsx:72` は真似しない）。

### 5-5. 公開前に済ませること

- 監査のM-2（管理者ログインの回数制限）とM-3（権限が90日間セッションに残る）。SBに書ける画面を、今の認証のまま公開しない。M-1は済み（PR #19）。

## 6. 決めたこと・確かめたこと（2026-11-12）

1. **予約の受け方は、SOGAの店舗と同じにする。** SOGAに届かない時は受けない（3-2-1）。
2. **MONËのSBアカウント（`H000456371`）の今の状態**（SOGAの本番DBを読み取り専用で確認）：
   - VPS上のプロファイルは**もうない**。SOGAの試験テナント `demo-salon` のクラウド設定は、2026-10-31に停止され、プロファイルの削除まで済んでいる（`provisionState: DELETED`、ホストなし）。預かりのパスワード・拡張の公開鍵も残っていない。ホスト `ablenet-1` の報告でも、載っているプロファイルは0件。
   - **SBとの接続の記録（`SalonboardConnection`）は `demo-salon` に残っている。** 予約の連携のスイッチはすべて切れている（最終更新は2026-11-01）。
   - **残っている接続の記録は、MONËの正式なテナントを作る前に消す必要がある。** SOGAは、同じSB店舗番号の接続が他にあると新しい接続を断る（アプリ側の確認だけで、監査のG-5）。消すのはSOGAの運営の操作で、SOGA側の作業（H-0）とする。
   - 確認できていないこと：10-31の試験はプレビュー（Neonの開発用DB）でも行っている。開発用DBの接続先が手元にないため、そちらは見ていない。ただし、VPSのプロファイルは本番の記録でも0件なので、VPSにMONËの資格情報が残っていないことは確か。
   - ホスト `ablenet-1` の最後の問い合わせは 2026-11-12 02:56（UTC）。止められていない（`disabledAt` なし）が、半日問い合わせがない。ユーザーの説明（VPSを切り離している）と合う。
3. **SOGAの利用権・プラン：** 問題なし（ユーザー確認済み）。
4. **MONËは、今のVPS（`ablenet-1`）に載せてよい。別のVPSは要らない。**
   - VPSに店舗を足しても、VPSが信じる相手は増えない（どの店舗も同じ拡張・同じSOGA）。危険が増えるのは、信じる相手（拡張の配布元、鍵の発行元、SSHで入る人）が増える時。
   - `ablenet-1` は8店舗まで載せられ、今は0件。
   - **プールを分けるのは、次のどれかに当たる時にする。** ①そのプロジェクトのVPSに、別の人がSSHで入る、②契約や約束で、他の店舗と同じVPSに置けない、③台数が足りない。MONËはどれにも当たらない。
   - プールの仕組み（H-1）は先に作り、`ablenet-1` とMONËを既定のプール `soga` に入れる。後でプールを分けたくなっても、設定の変更だけで済む。
5. **SSHの鍵は、今は分けなくてよい。**
   - 入る人が1人のうちは、鍵を分けても守れる範囲は変わらない（その人のPCが奪われれば、どの鍵も一緒に奪われる）。
   - **分けるのは、2人目の運用者が出た時、またはプールを分けた時。** その時は、人ごと・プールごとに鍵を作り、`AllowUsers` と `authorized_keys` をVPSごとに分ける。
   - 今やっておくとよいこと：鍵（`~/.ssh/sb_vps_ed25519`）にパスフレーズを付ける。鍵をリポジトリやCIに置かない。

## 7. 進める順番

1. SOGA：H-0（古い接続の記録を消す）、H-1（プール）、H-6（運営画面の2段階認証）、H-7（小さな直し）
2. SOGA：H-2〜H-5（鍵・外部予約・API・Webhook）とH-8（設定画面への一度きりのリンク）。SOGAの開発用DBとプレビューで確かめる
3. MONË：5-5（M-2・M-3）
4. MONË：5-1〜5-4。プレビュー（Neonの開発用ブランチ）とSOGAのプレビューをつないで確かめる
5. 実際のSBでの確認。SBには試験用の環境がないので、**実店舗のSBに書くことになる。** 営業時間外に、オーナーの立ち会いで、取り消す前提の予約を1件ずつ行う
6. 公開

## 8. 動作確認の手順（案）

- 鍵：範囲外の店舗・失効した鍵・別の利用者の鍵が、すべて401／403になる。
- 枠を押さえる：同じ枠への2つの `PUT` を同時に送ると、片方だけ `CONFIRMED` になる。SOGA自身の予約と重なる枠は `CONFLICT` になる。
- 読取が古い日：`occupancy` が `open: false` を返す。`PUT` は約20秒待ち、確かめられなければ `REQUESTED` になる。SBに書いて照合できた後、`booking.state_changed` で確定が届く。
- 分かっている停止（画像認証待ちなど）：`PUT` が `PAUSED` になり、申込にも回らない。受け口が `ADMIN` なら確定する。
- SOGAに届かない時：MONËが予約を取り消し、「お店にご連絡ください」を出す。
- Webhook：署名違い・5分より古い・同じイベントIDの再送を、MONËが受けない。MONËが落ちている間のイベントが、再開後に届く。
- Neon：誰も操作していない間、MONËとSOGAのどちらのDBにも問い合わせが来ない（Neonの画面で、5分たつと止まることを確かめる）。
- プール：MONËのプールの店舗が、SOGAのプールのホストに載らない。逆も同じ。

## 9. 確認できていないこと

- SOGAの開発用DB（プレビュー）に、MONËのSB店舗の試験の記録が残っているか（6章の2）。
- SOGAの書込の試行を「外部予約」に広げる作業の正確な大きさ（H-3）。書込の中心部分（`salonboard-write-attempt-*`、`salonboard-sync.ts`、占有の判定）を細かく読む必要がある。
- `occupancy` を、SOGAの今の「生の占有」の仕組み（`salonboard-live.ts`）でそのまま返せるか。今はSOGAの公開予約の画面のためだけに作られている。
- VPS（ABLENET）の実機の設定（ファイアウォールなど）。手順書とコードだけを見た。

## 10. MONË側の実装（2026-11-13）

5章のうち、5-1〜5-4をMONËに入れた。**SOGA側の共通APIとWebhook（H-2〜H-5）はまだない。** そのため、MONËの実装は3章の取り決めに合わせて書き、SOGAの応答は試験の中で作った応答で確かめただけである。

### 10-1. 連携の入り切り

- `SB_HUB_URL`・`SB_HUB_API_KEY`・`SB_HUB_SHOP_ID` の3つがそろい、URLが `https://` の時だけ連携が動く。どれかが欠ければ、空き枠・予約・取り消し・管理画面の動きは今までと同じ（SOGAへは何も送らない）。
- `SB_HUB_WEBHOOK_SECRET` がない間、`/api/sb-hub/webhook` は404を返す。
- `SB_HUB_STAFF_ID`（必須）：SOGAでのMONËの担当ID。SOGAは担当のない予約を受けない（H-3, #406）ので、これがないとハブにつながない。占有はその担当の分と、担当のない占有だけを見る。

### 10-2. 入れたもの

| 場所 | すること |
| --- | --- |
| `web/src/lib/sb-hub.ts` | SOGAの共通APIの呼び出し（占有・優先読取・枠を押さえる・取り消す・状態）。時間切れは、枠を押さえる・取り消すが30秒、それ以外は8秒。占有は同じ日について15秒覚える。鍵・URL・応答の本文はログに出さない |
| `web/src/lib/sb-hub-sync.ts` | 予約の今の状態をSOGAに伝える（版を1つ上げてから送る） |
| `web/src/lib/sb-hub-webhook.ts`・`web/src/app/api/sb-hub/webhook/route.ts` | Webhookの受け口。署名・5分の時刻の幅・イベントIDの重複除き。イベントの記録と予約の更新は1つのトランザクション（失敗すれば記録も残らず、SOGAが送り直す） |
| `/api/availability` | 連携が有効なら、SBの占有を重ねる。分からない日・`open: false` の日は枠を出さず、お知らせを出す。お客様が日付を選んだ時（`demand=1`）だけ、優先読取を送る（応答の後に送る） |
| `POST /api/reservations`（お客様） | MONËに予約を作ってから、SOGAに枠を押さえてもらう（受け口 `PUBLIC`）。`CONFIRMED` は今までと同じ。`REQUESTED` は「申込」として残し、確定のメールは送らない（完了画面も申込の文言にする）。`CONFLICT`・`PAUSED`・届かない時は、MONËの予約を消して断る。届かない時は、念のため取り消しも送る |
| お客様の取り消し・管理画面の作成・変更・状態の変更 | 変えた後にSOGAに伝える（受け口 `ADMIN`）。SOGAに送れなくても予約は残し、「SBへ手で入力」と「要確認」にする |
| 管理画面の削除 | 行を消す前に、SOGAにある予約を取り消す。取り消せない時は消さない（SBに残ったままになるため） |
| 予約管理の画面 | 「SB連携」欄（画面を開いた時と再読込の時だけ取る）：状態、SOGAの設定画面へのリンク、要確認・申込の予約、「確認済みにする」。予約の欄に「SB反映待ち」などを出す |
| スキーマ | `Reservation` に `sbState`・`sbVersion`・`sbReservationNo`・`sbRequested`・`sbNeedsReview`。表 `SbHubEvent` |

### 10-3. 3章から決め足したこと（SOGA側のH-3〜H-5で合わせる）

- `PUT bookings` の本文：`{ version, staffId, date, start, end, status: "ACTIVE", noteName, origin }`。答え：`{ answer: "CONFIRMED" | "REQUESTED" | "CONFLICT" | "PAUSED" }`（HTTPは200・201、`CONFLICT` は409でもよい）。
- `DELETE bookings`：200・202・204を受けた、404はSOGAが知らない予約（取り消す物がない）として扱う。
- `occupancy` の答え：`{ days: [{ date, open, busy: [{ staffId?, start: "HH:MM", end: "HH:MM" }] }] }`。
- `read-demand` の本文：`{ dates: ["YYYY-MM-DD"] }`。
- `status` の答え：`{ state: "CONNECTED" | "LOGIN_REQUIRED" | "CAPTCHA_REQUIRED" | "STALE" | "STOPPED", settingsUrl }`。
- Webhookの形：`{ id, type, data }`。`booking.state_changed` の `state` に、**`DECLINED`（申込が成り立たなかった）を足した。** 3章の状態（`PENDING` `APPLIED` `VERIFY_REQUIRED` `MANUAL_REQUIRED`）だけでは、申込の不成立をMONËが知れないため。受けると、MONËの予約を取り消し、お客様にメールする。
- 秘密の入れ替えの間は、`X-Sb-Hub-Signature` に `v1=` を2つ並べてよい（どちらかが合えば受ける）。
- 予約管理の画面の「SB連携」欄に「SBの設定を開く」ボタンを足した（3-4）。押すと、MONËのサーバーが `setup-link` を呼び、返ってきたSOGAのリンクを新しいタブで開く。リンクはMONËに保存しない。
- 管理画面の予約がSOGAに届かない時：3-2-1は「届かない時は受けない」としたが、これはお客様の予約の話とし、**管理画面の予約（電話の予約など）は残して、SBへ手で入れる扱いにした。** 店がSOGAの障害で電話の予約を取れなくなるのを避けるため。

### 10-4. 本番に出す前に

1. **本番DBのスキーマを先に変える。** Prismaは予約の全部の列を読むので、列がないまま新しいコードが動くと、予約まわりがすべて失敗する。SQLは列と表を足すだけ（10-5）。本番への書き込みは、ユーザーの了承を得てから行う。
2. SOGA側のH-2〜H-5（鍵・外部予約・API・Webhook）、H-6（運営画面の2段階認証）、H-8（設定画面への一度きりのリンク）を済ませる。
3. SOGAの運営画面で、MONËのテナント・店舗・鍵・Webhookの宛先（`https://<MONËのドメイン>/api/sb-hub/webhook`）を作る。オーナーがSOGAでSBの初期設定をする（SBのID・パスワードの入力はオーナーが行う）。
4. VercelのMONEの環境変数に、10-1の値を入れる（まずプレビューだけ）。プレビューとSOGAのプレビューで、8章の確認をする。
5. 本番の環境変数を入れる。入れるまでは、本番の動きは今と同じ。

### 10-5. スキーマの変更（本番に流すSQL）

```sql
CREATE TYPE "SbSyncState" AS ENUM ('NONE', 'PENDING', 'APPLIED', 'VERIFY_REQUIRED', 'MANUAL_REQUIRED');
ALTER TABLE "Reservation" ADD COLUMN "sbNeedsReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sbRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sbReservationNo" TEXT,
ADD COLUMN "sbState" "SbSyncState" NOT NULL DEFAULT 'NONE',
ADD COLUMN "sbVersion" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "SbHubEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SbHubEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SbHubEvent_receivedAt_idx" ON "SbHubEvent"("receivedAt");
CREATE INDEX "Reservation_sbNeedsReview_idx" ON "Reservation"("sbNeedsReview");
```

既定値つきの列の追加は、PostgreSQLでは表を書き直さない。予約は約1,000件。

### 10-6. 確認できていないこと

- 実際のSOGAとのやり取り（SOGA側のAPIがまだない）。
- 空き枠の画面で、SBの占有が分からない日のお知らせの見え方（ブラウザで見ていない）。
- 管理画面の「SB連携」欄の見え方（連携が無効の間は出ないので、本番・プレビューでは出ない）。
- E2E（Playwright）は、連携が無効の状態で今までどおり通るかだけを見る。連携が有効な状態のE2Eは、SOGAのプレビューができてから足す。
- `SbHubEvent` は増え続ける。古い行（例：30日より前）を消す処理は、毎日動いている処理に足すか、SOGA側が同じイベントIDを送り直す期間（最長約15時間）に合わせて決める。
