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
| `PUT /shops/{shopId}/bookings/{externalId}` | 枠を押さえる・変える。本文：版（`version`）、担当（プロジェクトの担当ID）、日付、開始・終了、状態（`ACTIVE`）、SBのメモに書く名前 | 書く | 冪等。同じ `externalId` と `version` の再送は、同じ答えを返す。**答え**：`ACCEPTED`（占有を取った。SBへの書込はこれから）／`CONFLICT`（SBかほかの予約と重なる）／`NOT_OPEN`（その日はSBの読取が古いなどで受けられない）／`STALE_VERSION` |
| `DELETE /shops/{shopId}/bookings/{externalId}?version=n` | 取り消し | 書く | 占有は、SBでの取り消しを確かめるまで残す（SOGAの今の規則） |
| `GET /shops/{shopId}/bookings/{externalId}` | 今の同期の状態（`PENDING` `APPLIED` `VERIFY_REQUIRED` `MANUAL_REQUIRED`） | 読む | Webhookを取りこぼしたときの確認用。定期的には呼ばない |

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

## 4. SOGA側で必要な作業

| # | 作業 | 大きさ |
| --- | --- | --- |
| H-1 | **ホストのプール**：`SalonboardHostPool` を足す。`SalonboardHost.poolId` と、店舗（またはテナント）の `salonboardHostPoolId` を持たせる。`assignWaitingSetups` の条件にプールの一致を加える。既存のホストと店舗は既定のプール `soga` に入れる | 小 |
| H-2 | **利用者と鍵**：`SalonboardHubClient`、`SalonboardHubKey`（鍵IDとハッシュ、範囲、失効日）、運営画面での発行・失効 | 中 |
| H-3 | **外部予約**：`SalonboardExternalBooking`（`clientId`、`tenantId`、`shopId`、`externalId`、`version`、状態、担当、日時、メモの名前）。占有の表と書込の試行の対象を「予約か外部予約」に広げる | **大**（SBへの書込の中心部分に手を入れる） |
| H-4 | **APIの受け口**（3-2） | 中 |
| H-5 | **Webhook**：イベントの記録、署名、キューでの配送と再送、宛先の登録 | 中 |
| H-6 | **運営画面のログインの強化**（2段階認証）。窓口になると、SOGAの運営画面が奪われたときに、全プロジェクト・全VPSに届くため | 中 |
| H-7 | 監査で見つかった小さな直し：診断ログをサーバー側でも検査する（G-1）、終わった記録の名前を消す（G-2）、ペアリングコードの旧形式を消す（G-3）、ホストのエラーの文字を絞る（G-4）、`externalShopId` に一意の制約を付ける（G-5） | 小 |

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
3. **確定する時**：MONËのDBに予約を `sbState: PENDING` で作り、`PUT bookings/{予約ID}` を呼ぶ。
   - `ACCEPTED`：お客様に確定を返す。
   - `CONFLICT`・`NOT_OPEN`：MONËの予約を取り消し、「その時間は埋まりました」と返す。
   - SOGAに届かない・時間切れ：**決めることがある**（6章の1）。
4. **変更・取り消し**：MONËで変えたら、版を1つ上げて `PUT`／`DELETE` を呼ぶ。
5. **Webhookを受けた時**（`/api/sb-hub/webhook`）：署名と時刻を確かめ、イベントIDで重複を除き、該当する予約の `sbState` を更新する。`booking.changed_in_sb` は、管理画面の「要確認」に出す（MONËの予約を自動で変えない・消さない。SOGAの今の規則と同じ）。

### 5-4. 管理画面

- 予約の一覧・詳細に、SBへの反映の状態を出す。
- 「SB連携」の欄：連携の状態（`status` を画面を開いた時だけ取る）、要確認の予約、SOGAの設定画面へのリンク。**定期的に読み直さない**（SOGAの設定画面の30秒ごとの読み直し、SOGA `salonboardSettingsData.ts:43`・`SalonboardCloudClient.tsx:72` は真似しない）。

### 5-5. 公開前に済ませること

- 監査のM-2（管理者ログインの回数制限）とM-3（権限が90日間セッションに残る）。SBに書ける画面を、今の認証のまま公開しない。M-1は済み（PR #19）。

## 6. 決めること・確かめること

1. **SOGAに届かない時、MONËは予約を受けるか。** 受けると二重予約の危険があり、受けないとSOGAの障害の間、MONËの予約が止まる。案：受けずに「電話で」と出す。
2. **MONËのSBアカウント（`H000456371`）が、今もSOGAの試験店舗としてVPSに残っているか。** 残っていれば、そのテナントをMONËの正式なテナントに整えるか、消して作り直すかを決める。
3. **SOGAの利用権・プラン**で、外部の利用者のテナントをどう扱うか。
4. **VPSのプールの分け方。** MONËの店舗を、今のVPS（既定のプール `soga`）に載せるか、MONË用のVPS（プール `mone`）を立てるか。分けるなら、新しいVPSは今の手順（`harden-host.sh` → Chromeと画面 → `install-extension-policy.sh` → 運営画面でホストを登録 → `install-agent.sh`）で立てる。立てる作業は、その時にあらためて了承をもらう。
5. **VPSのSSHの鍵を、プールごとに分けるか。** 扱う人がプロジェクトごとに分かれるなら分ける。

## 7. 進める順番

1. SOGA：H-1（プール）、H-6（運営画面の2段階認証）、H-7（小さな直し）
2. SOGA：H-2〜H-5（鍵・外部予約・API・Webhook）。SOGAの開発用DBとプレビューで確かめる
3. MONË：5-5（M-2・M-3）
4. MONË：5-1〜5-4。プレビュー（Neonの開発用ブランチ）とSOGAのプレビューをつないで確かめる
5. 実際のSBでの確認。SBには試験用の環境がないので、**実店舗のSBに書くことになる。** 営業時間外に、オーナーの立ち会いで、取り消す前提の予約を1件ずつ行う
6. 公開

## 8. 動作確認の手順（案）

- 鍵：範囲外の店舗・失効した鍵・別の利用者の鍵が、すべて401／403になる。
- 枠を押さえる：同じ枠への2つの `PUT` を同時に送ると、片方だけ `ACCEPTED` になる。SOGA自身の予約と重なる枠は `CONFLICT` になる。
- 読取が古い日：`occupancy` が `open: false` を返し、`PUT` が `NOT_OPEN` になる。
- Webhook：署名違い・5分より古い・同じイベントIDの再送を、MONËが受けない。MONËが落ちている間のイベントが、再開後に届く。
- Neon：誰も操作していない間、MONËとSOGAのどちらのDBにも問い合わせが来ない（Neonの画面で、5分たつと止まることを確かめる）。
- プール：MONËのプールの店舗が、SOGAのプールのホストに載らない。逆も同じ。

## 9. 確認できていないこと

- SOGAの利用権・プランの扱い。
- SOGAの書込の試行を「外部予約」に広げる作業の正確な大きさ（H-3）。書込の中心部分（`salonboard-write-attempt-*`、`salonboard-sync.ts`、占有の判定）を細かく読む必要がある。
- `occupancy` を、SOGAの今の「生の占有」の仕組み（`salonboard-live.ts`）でそのまま返せるか。今はSOGAの公開予約の画面のためだけに作られている。
- VPS（ABLENET）の実機の設定（ファイアウォールなど）。手順書とコードだけを見た。
