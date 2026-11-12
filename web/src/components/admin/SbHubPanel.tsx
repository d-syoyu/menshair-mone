'use client';

// 管理画面の「SB連携」欄（設計 docs/salonboard-hub-design-2026-11-12.md 5-4）。
// 開いた時だけ状態を取る。定期的に読み直さない。連携が無効なら何も出さない。
// SBの初期設定・画像認証・ログインのやり直しは、「SBの設定を開く」からSOGAの画面で行う。

import { useEffect, useState } from 'react';

type ReviewRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  sbState: string;
  sbRequested: boolean;
  sbNeedsReview: boolean;
  customerName: string | null;
};

type StatusResponse =
  | { enabled: false }
  | {
      enabled: true;
      status: { reachable: false } | { reachable: true; state: string; settingsUrl: string | null };
      review: ReviewRow[];
    };

const STATE_LABELS: Record<string, string> = {
  CONNECTED: 'つながっています',
  LOGIN_REQUIRED: 'SBのログインが切れています',
  CAPTCHA_REQUIRED: '画像認証を待っています',
  STALE: 'SBの読取が古くなっています',
  STOPPED: '停止しています',
  UNKNOWN: '状態が分かりません',
};

export const SB_STATE_LABELS: Record<string, string> = {
  PENDING: 'SB反映待ち',
  APPLIED: 'SB反映済み',
  VERIFY_REQUIRED: 'SB要確認',
  MANUAL_REQUIRED: 'SBへ手で入力',
};

function reason(row: ReviewRow) {
  if (row.sbRequested && row.status === 'CONFIRMED') return '申込（SBで確かめてから確定）';
  if (row.sbState === 'MANUAL_REQUIRED') return 'SOGAに送れませんでした。SBに手で入力・取消してください';
  if (row.sbState === 'VERIFY_REQUIRED') return 'SBの予約と重なった可能性があります';
  return 'SB上で変更・削除されました';
}

export default function SbHubPanel() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [failed, setFailed] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/sb-hub/status', { cache: 'no-store' });
      if (!res.ok) throw new Error('failed');
      setData(await res.json());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const [opening, setOpening] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // SOGAのSB設定画面を、一度きりのリンクで開く（設計 3-4）。
  // ポップアップを止められないよう、押した時にタブを先に開いてから行き先を入れる。
  const openSettings = async () => {
    setOpening(true);
    setLinkError(null);
    const tab = window.open('', '_blank');
    try {
      const res = await fetch('/api/admin/sb-hub/setup-link', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || typeof body.url !== 'string') throw new Error(body.error || 'SOGAの設定画面を開けませんでした');
      if (tab) {
        tab.opener = null;
        tab.location.href = body.url;
      } else {
        window.location.href = body.url;
      }
    } catch (error) {
      tab?.close();
      setLinkError(error instanceof Error ? error.message : 'SOGAの設定画面を開けませんでした');
    } finally {
      setOpening(false);
    }
  };

  const resolve = async (id: string) => {
    const res = await fetch('/api/admin/sb-hub/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: id }),
    });
    if (res.ok) load();
  };

  if (failed) {
    return <div className="mb-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">SB連携の状態を取得できませんでした。</div>;
  }
  if (!data || !data.enabled) return null;

  const status = data.status;
  const healthy = status.reachable && status.state === 'CONNECTED';

  return (
    <section aria-label="SB連携" className={`mb-6 rounded border p-4 text-sm ${healthy ? 'border-gray-200 bg-white' : 'border-amber-300 bg-amber-50'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">SB連携</h2>
        <div className="flex items-center gap-3">
          <span className={healthy ? 'text-green-700' : 'text-amber-800'}>
            {status.reachable ? STATE_LABELS[status.state] ?? STATE_LABELS.UNKNOWN : 'SOGAに接続できません（Web予約は受け付けていません）'}
          </span>
          <button type="button" onClick={openSettings} disabled={opening} className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-50">
            {opening ? '開いています…' : 'SBの設定を開く'}
          </button>
          <button type="button" onClick={load} className="rounded border border-gray-300 px-2 py-1 text-xs">再読込</button>
        </div>
      </div>
      {linkError && <p className="mt-2 text-xs text-red-700">{linkError}</p>}
      {data.review.length > 0 && (
        <ul className="mt-3 space-y-2">
          {data.review.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-white/70 px-3 py-2">
              <span>
                {row.date} {row.startTime}〜{row.endTime} {row.customerName ?? 'お客様'}：{reason(row)}
              </span>
              {row.sbNeedsReview && (
                <button type="button" onClick={() => resolve(row.id)} className="rounded border border-gray-300 px-2 py-1 text-xs">確認済みにする</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
