// src/lib/sb-hub.ts
// SALON BOARD連携：SOGAの共通窓口（ハブ）のクライアント。
// 設計：docs/salonboard-hub-design-2026-11-12.md（3章がSOGA側のAPI、5章がMONË側）。
//
// 環境変数（SB_HUB_URL・SB_HUB_API_KEY・SB_HUB_SHOP_ID）がそろっていない間は、連携は無効。
// どの関数も何もせず、予約の流れは今までと同じになる。
//
// 鍵・URL・SOGAの応答の本文は、ログにもお客様への応答にも出さない。

export type SbHubOrigin = "PUBLIC" | "ADMIN";

/** 枠を押さえた時の答え（設計 3-2-1）。UNREACHABLE は SOGA に届かなかった・時間切れ・想定外の応答。 */
export type SbHubBookingAnswer = "CONFIRMED" | "REQUESTED" | "CONFLICT" | "PAUSED" | "UNREACHABLE";

export interface SbHubBusyRange {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface SbHubDayOccupancy {
  /** false の日は予約を受けない（読取が古い・欠けている。SOGAの「分からない日は閉じる」）。 */
  open: boolean;
  busy: SbHubBusyRange[];
}

export interface SbHubConfig {
  url: string;
  apiKey: string;
  shopId: string;
  /** SOGAでのMONËの担当ID。MONËはスタイリスト1名なので1つだけ持つ。SOGAは予約に担当を必ず求める。 */
  staffId: string;
}

/** 呼び出しの時間切れ。枠を押さえる時はSOGAが約20秒待つことがあるので30秒（設計 3-2-1）。 */
const BOOKING_TIMEOUT_MS = 30_000;
const READ_TIMEOUT_MS = 8_000;
/** 空き枠の答えを覚えておく時間（同じ画面の再表示で何度も聞かない。設計 5-3）。 */
const OCCUPANCY_CACHE_MS = 15_000;
/** SBのメモに書く名前の上限（SOGAの salonboardNote と同じ）。 */
const NOTE_NAME_MAX = 60;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

export function sbHubConfig(env: Record<string, string | undefined> = process.env): SbHubConfig | null {
  const url = env.SB_HUB_URL?.trim();
  const apiKey = env.SB_HUB_API_KEY?.trim();
  const shopId = env.SB_HUB_SHOP_ID?.trim();
  const staffId = env.SB_HUB_STAFF_ID?.trim();
  // SOGAは担当のない予約を受けない（PUTで400）ので、担当IDがなければつながない。
  if (!url || !apiKey || !shopId || !staffId) return null;
  // 鍵を平文の通信で送らない。
  if (!url.startsWith("https://")) return null;
  return { url: url.replace(/\/+$/, ""), apiKey, shopId, staffId };
}

export function sbHubEnabled(): boolean {
  return sbHubConfig() !== null;
}

type FetchLike = typeof fetch;

async function call(
  config: SbHubConfig,
  method: string,
  path: string,
  { body, timeoutMs, fetchImpl = fetch }: { body?: unknown; timeoutMs: number; fetchImpl?: FetchLike }
): Promise<{ status: number; json: unknown } | null> {
  try {
    const res = await fetchImpl(`${config.url}/shops/${encodeURIComponent(config.shopId)}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, json };
  } catch {
    // 時間切れ・通信の失敗。理由は出さない（URLや鍵が混じることがあるため）。
    return null;
  }
}

function logFailure(what: string, status: number | null) {
  console.error(`[SB hub] ${what} failed`, { status });
}

// ---------- 空き枠 ----------

const occupancyCache = new Map<string, { at: number; value: Map<string, SbHubDayOccupancy> | null }>();

function parseOccupancy(json: unknown, staffId: string | null): Map<string, SbHubDayOccupancy> | null {
  const days = (json as { days?: unknown })?.days;
  if (!Array.isArray(days)) return null;
  const result = new Map<string, SbHubDayOccupancy>();
  for (const day of days) {
    const d = day as { date?: unknown; open?: unknown; busy?: unknown };
    if (typeof d.date !== "string" || !DATE.test(d.date)) return null;
    const busy: SbHubBusyRange[] = [];
    if (Array.isArray(d.busy)) {
      for (const item of d.busy) {
        const b = item as { start?: unknown; end?: unknown; staffId?: unknown };
        if (typeof b.start !== "string" || typeof b.end !== "string" || !TIME.test(b.start) || !TIME.test(b.end)) return null;
        // 担当が分かっていれば、MONËの担当の分だけを見る。担当なしの占有（店全体）は常に見る。
        if (staffId && typeof b.staffId === "string" && b.staffId !== staffId) continue;
        busy.push({ start: b.start, end: b.end });
      }
    }
    result.set(d.date, { open: d.open === true, busy });
  }
  return result;
}

/**
 * SB側の占有。null は「分からない」：その日は予約を受けない（SOGAに届かない時は受けない、設計 3-2-1）。
 * 連携が無効なら呼ばないこと（sbHubEnabled）。
 */
export async function getSbOccupancy(
  date: string,
  { config = sbHubConfig(), fetchImpl, now = Date.now() }: { config?: SbHubConfig | null; fetchImpl?: FetchLike; now?: number } = {}
): Promise<SbHubDayOccupancy | null> {
  if (!config || !DATE.test(date)) return null;
  const cached = occupancyCache.get(date);
  if (cached && now - cached.at < OCCUPANCY_CACHE_MS) return cached.value?.get(date) ?? null;
  const res = await call(config, "GET", `/occupancy?from=${date}&to=${date}`, { timeoutMs: READ_TIMEOUT_MS, fetchImpl });
  const value = res && res.status === 200 ? parseOccupancy(res.json, config.staffId) : null;
  if (!value) logFailure("occupancy", res?.status ?? null);
  occupancyCache.set(date, { at: now, value });
  return value?.get(date) ?? null;
}

/** テスト用。 */
export function clearSbOccupancyCache() {
  occupancyCache.clear();
}

/** その時間がSB側で埋まっているか。 */
export function sbBusyOverlaps(day: SbHubDayOccupancy, start: string, end: string): boolean {
  return day.busy.some((range) => start < range.end && end > range.start);
}

/**
 * お客様が日付を見ている：SOGAにその日を優先して読み直してもらう。
 * お客様の操作（日付を選んだ時）だけ送る。定期的に送らない（設計 3-2）。答えは待たない。
 */
export async function sendSbReadDemand(
  date: string,
  { config = sbHubConfig(), fetchImpl }: { config?: SbHubConfig | null; fetchImpl?: FetchLike } = {}
): Promise<void> {
  if (!config || !DATE.test(date)) return;
  const res = await call(config, "POST", "/read-demand", { body: { dates: [date] }, timeoutMs: READ_TIMEOUT_MS, fetchImpl });
  if (!res || res.status >= 300) logFailure("read-demand", res?.status ?? null);
  occupancyCache.delete(date);
}

// ---------- 枠を押さえる・取り消す ----------

export interface SbHubBookingInput {
  reservationId: string;
  version: number;
  date: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  customerName: string | null;
  origin: SbHubOrigin;
}

/** SBのメモに書く名前。お客様の情報で渡すのはこれだけ（設計 3-2-1）。 */
export function sbNoteName(name: string | null | undefined): string {
  const cleaned = (name ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || "お客様").slice(0, NOTE_NAME_MAX);
}

const ANSWERS = new Set<SbHubBookingAnswer>(["CONFIRMED", "REQUESTED", "CONFLICT", "PAUSED"]);

export async function putSbBooking(
  input: SbHubBookingInput,
  { config = sbHubConfig(), fetchImpl }: { config?: SbHubConfig | null; fetchImpl?: FetchLike } = {}
): Promise<SbHubBookingAnswer> {
  if (!config) return "UNREACHABLE";
  const res = await call(config, "PUT", `/bookings/${encodeURIComponent(input.reservationId)}`, {
    body: {
      version: input.version,
      staffId: config.staffId,
      date: input.date,
      start: input.startTime,
      end: input.endTime,
      status: "ACTIVE",
      noteName: sbNoteName(input.customerName),
      origin: input.origin,
    },
    timeoutMs: BOOKING_TIMEOUT_MS,
    fetchImpl,
  });
  const answer = (res?.json as { answer?: unknown } | null)?.answer;
  if (res && (res.status === 200 || res.status === 201 || res.status === 409) && typeof answer === "string"
    && ANSWERS.has(answer as SbHubBookingAnswer)) {
    occupancyCache.delete(input.date);
    return answer as SbHubBookingAnswer;
  }
  logFailure("booking", res?.status ?? null);
  return "UNREACHABLE";
}

/** 取り消し。true はSOGAが受けた（SB上の取り消しはSOGAが確かめる）。 */
export async function deleteSbBooking(
  reservationId: string,
  version: number,
  { config = sbHubConfig(), fetchImpl }: { config?: SbHubConfig | null; fetchImpl?: FetchLike } = {}
): Promise<boolean> {
  if (!config) return false;
  const res = await call(config, "DELETE", `/bookings/${encodeURIComponent(reservationId)}?version=${version}`, {
    timeoutMs: BOOKING_TIMEOUT_MS,
    fetchImpl,
  });
  // 404：SOGAが知らない予約（送る前に失敗したもの）。取り消す物がないので受けたのと同じ。
  if (res && (res.status === 200 || res.status === 202 || res.status === 204 || res.status === 404)) {
    occupancyCache.clear();
    return true;
  }
  logFailure("booking delete", res?.status ?? null);
  return false;
}

// ---------- 連携の状態（管理画面を開いた時だけ） ----------

export type SbHubShopStatus =
  | { reachable: false }
  | { reachable: true; state: string; settingsUrl: string | null };

const SHOP_STATES = new Set(["CONNECTED", "LOGIN_REQUIRED", "CAPTCHA_REQUIRED", "STALE", "STOPPED"]);

export async function getSbShopStatus(
  { config = sbHubConfig(), fetchImpl }: { config?: SbHubConfig | null; fetchImpl?: FetchLike } = {}
): Promise<SbHubShopStatus> {
  if (!config) return { reachable: false };
  const res = await call(config, "GET", "/status", { timeoutMs: READ_TIMEOUT_MS, fetchImpl });
  const json = res?.json as { state?: unknown; settingsUrl?: unknown } | null;
  if (!res || res.status !== 200 || typeof json?.state !== "string") {
    logFailure("status", res?.status ?? null);
    return { reachable: false };
  }
  const settingsUrl = typeof json.settingsUrl === "string" && json.settingsUrl.startsWith("https://") ? json.settingsUrl : null;
  return { reachable: true, state: SHOP_STATES.has(json.state) ? json.state : "UNKNOWN", settingsUrl };
}

// ---------- SOGAのSB設定画面への一度きりのリンク（設計 3-4） ----------

/**
 * SOGAのSB設定画面に入るリンク（5分・1回だけ）。管理者がボタンを押した時だけ出す。保存しない。
 * SOGAの答えのURLは、共通窓口と同じ配信元のものだけを使う（別のサイトへ飛ばされないように）。
 */
export async function createSbSetupLink(
  actor: string,
  { config = sbHubConfig(), fetchImpl }: { config?: SbHubConfig | null; fetchImpl?: FetchLike } = {}
): Promise<string | null> {
  if (!config) return null;
  const res = await call(config, "POST", "/setup-link", { body: { actor: actor.slice(0, 200) }, timeoutMs: READ_TIMEOUT_MS, fetchImpl });
  const url = (res?.json as { url?: unknown } | null)?.url;
  if (!res || (res.status !== 200 && res.status !== 201) || typeof url !== "string") {
    logFailure("setup link", res?.status ?? null);
    return null;
  }
  try {
    const link = new URL(url);
    if (link.protocol !== "https:" || link.origin !== new URL(config.url).origin) throw new Error("origin");
    return link.toString();
  } catch {
    logFailure("setup link", res.status);
    return null;
  }
}
