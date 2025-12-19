'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Calendar, User, LogOut, ArrowRight, Clock, Scissors, Edit2, Save, X, Phone } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface Reservation {
  id: string;
  menuSummary: string;
  totalPrice: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
}


// ユーザープロフィールの型
interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function MyPage() {
  const { data: session } = useSession();
  const [upcomingReservations, setUpcomingReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // プロフィール編集
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ユーザープロフィールを取得
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data.user);
          setEditName(data.user.name || '');
          setEditPhone(data.user.phone || '');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await fetch('/api/reservations?status=CONFIRMED&limit=50');
        const data = await res.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming =
          data.reservations?.filter((r: Reservation) => {
            const reservationDate = new Date(r.date);
            reservationDate.setHours(0, 0, 0, 0);
            return reservationDate >= today;
          }) || [];

        setUpcomingReservations(upcoming.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch reservations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const startEditing = () => {
    setEditName(userProfile?.name || '');
    setEditPhone(userProfile?.phone || '');
    setIsEditing(true);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const saveProfile = async () => {
    if (!editName.trim()) {
      setSaveError('お名前を入力してください');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || '保存に失敗しました');
        return;
      }
      setUserProfile(data.user);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}（${WEEKDAYS[date.getDay()]}）`;
  };

  return (
    <div className="min-h-screen bg-dark pt-32 pb-20">
      <div className="container-wide max-w-2xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <p className="text-subheading mb-2">My Page</p>
          <h1 className="text-heading mb-4 text-white">マイページ</h1>
          <div className="divider-line mx-auto" />
        </motion.div>

        {/* User Info */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="glass-card p-6 mb-8"
        >
          {saveSuccess && (
            <div className="bg-green-900/30 border border-green-500/50 text-green-400 px-4 py-2 rounded mb-4 text-sm">
              プロフィールを更新しました
            </div>
          )}
          {saveError && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-2 rounded mb-4 text-sm">
              {saveError}
            </div>
          )}

          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white">プロフィール編集</h3>
                <button onClick={cancelEditing} className="text-text-muted hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>
                <label className="block text-xs tracking-wider text-text-muted uppercase mb-2">
                  お名前 <span className="text-red-400">*</span>
                </label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  placeholder="山田 太郎" maxLength={100}
                  className="w-full p-3 border border-glass-border rounded bg-glass-light text-white placeholder-text-muted focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div>
                <label className="block text-xs tracking-wider text-text-muted uppercase mb-2">電話番号</label>
                <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="090-1234-5678" maxLength={20}
                  className="w-full p-3 border border-glass-border rounded bg-glass-light text-white placeholder-text-muted focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={cancelEditing} className="flex-1 py-2 text-sm border border-glass-border text-white hover:bg-glass-light transition-colors rounded">
                  キャンセル
                </button>
                <button onClick={saveProfile} disabled={isSaving}
                  className="flex-1 py-2 text-sm bg-accent text-white hover:bg-accent-light transition-colors disabled:opacity-50 rounded flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />{isSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-lg text-white">
                  {userProfile?.name || session?.user?.name || 'ゲスト'}
                </p>
                <p className="text-sm text-text-muted">
                  {userProfile?.email || session?.user?.email}
                </p>
                {userProfile?.phone && (
                  <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />{userProfile.phone}
                  </p>
                )}
              </div>
              <button onClick={startEditing} className="text-text-muted hover:text-accent transition-colors p-2" title="プロフィールを編集">
                <Edit2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          <Link
            href="/booking"
            className="flex items-center gap-4 p-6 bg-accent text-white rounded hover:bg-accent-light transition-colors"
          >
            <Calendar className="w-6 h-6" />
            <div className="flex-1">
              <p className="font-medium">新規予約</p>
              <p className="text-sm opacity-70">空き状況を確認</p>
            </div>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/mypage/reservations"
            className="flex items-center gap-4 p-6 glass-card hover:border-accent transition-colors"
          >
            <Clock className="w-6 h-6 text-accent-light" />
            <div className="flex-1">
              <p className="font-medium text-white">予約履歴</p>
              <p className="text-sm text-text-muted">
                過去・今後の予約を確認
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-text-muted" />
          </Link>
        </motion.div>

        {/* Upcoming Reservations */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="glass-card p-6 mb-8"
        >
          <div className="mb-6">
            <h2 className="text-lg font-medium text-white">直近の予約</h2>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-text-muted">
              読み込み中...
            </div>
          ) : upcomingReservations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted mb-4">
                予約はまだありません
              </p>
              <Link
                href="/booking"
                className="btn-primary"
              >
                予約する
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingReservations.map((reservation) => (
                <Link
                  key={reservation.id}
                  href={`/mypage/reservations?id=${reservation.id}`}
                  className="flex items-center gap-4 p-4 bg-dark-gray/50 rounded hover:bg-dark-gray transition-colors"
                >
                  <div className="w-12 h-12 bg-dark rounded flex items-center justify-center border border-glass-border">
                    <Scissors className="w-5 h-5 text-accent-light" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {reservation.menuSummary || 'メニュー未設定'}
                    </p>
                    <p className="text-sm text-text-muted">
                      {formatDate(reservation.date)} {reservation.startTime}〜
                    </p>
                    <p className="text-sm text-gold">
                      ¥{reservation.totalPrice.toLocaleString()}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-text-muted" />
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center"
        >
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 text-text-muted hover:text-red-400 border border-transparent hover:border-red-400/30 hover:bg-red-400/10 rounded transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </motion.div>
      </div>
    </div>
  );
}
