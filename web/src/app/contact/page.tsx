'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, Check, User, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';

const menuCategories = [
  {
    id: 'cut',
    name: 'カット',
    nameEn: 'Cut',
    items: [
      { id: 'cut-basic', name: 'カット', price: '¥5,500' },
      { id: 'cut-bangs', name: '前髪カット', price: '¥1,100' },
      { id: 'cut-kids', name: 'キッズカット（小学生以下）', price: '¥3,300' },
    ]
  },
  {
    id: 'color',
    name: 'カラー',
    nameEn: 'Color',
    items: [
      { id: 'color-full', name: 'フルカラー', price: '¥8,800' },
      { id: 'color-retouch', name: 'リタッチカラー', price: '¥6,600' },
      { id: 'color-illumina', name: 'イルミナカラー', price: '¥11,000' },
      { id: 'color-highlight', name: 'ハイライト', price: '¥5,500〜' },
      { id: 'color-gray', name: 'グレイカラー（白髪染め）', price: '¥7,700' },
    ]
  },
  {
    id: 'perm',
    name: 'パーマ',
    nameEn: 'Perm',
    items: [
      { id: 'perm-basic', name: 'パーマ', price: '¥8,800' },
      { id: 'perm-digital', name: 'デジタルパーマ', price: '¥13,200' },
      { id: 'perm-cosme', name: 'コスメパーマ', price: '¥11,000' },
      { id: 'perm-point', name: 'ポイントパーマ', price: '¥5,500〜' },
    ]
  },
  {
    id: 'straightening',
    name: '縮毛矯正',
    nameEn: 'Straightening',
    items: [
      { id: 'straight-basic', name: '縮毛矯正', price: '¥17,600〜' },
      { id: 'straight-bangs', name: 'ポイント縮毛矯正（前髪）', price: '¥5,500' },
      { id: 'straight-acid', name: '酸性ストレート', price: '¥22,000' },
    ]
  },
  {
    id: 'hair-improvement',
    name: '髪質改善',
    nameEn: 'Hair Improvement',
    items: [
      { id: 'improve-basic', name: '髪質改善トリートメント', price: '¥11,000' },
      { id: 'improve-acid', name: '酸熱トリートメント', price: '¥16,500' },
      { id: 'improve-tokio', name: 'TOKIO インカラミ', price: '¥8,800' },
    ]
  },
  {
    id: 'treatment',
    name: 'トリートメント',
    nameEn: 'Treatment',
    items: [
      { id: 'treat-quick', name: 'クイックトリートメント', price: '¥2,200' },
      { id: 'treat-special', name: 'スペシャルトリートメント', price: '¥4,400' },
      { id: 'treat-premium', name: 'プレミアムトリートメント', price: '¥6,600' },
    ]
  },
  {
    id: 'spa',
    name: 'ヘッドスパ',
    nameEn: 'Head Spa',
    items: [
      { id: 'spa-quick', name: 'クイックスパ（15分）', price: '¥2,200' },
      { id: 'spa-relax', name: 'リラックススパ（30分）', price: '¥4,400' },
      { id: 'spa-premium', name: 'プレミアムスパ（45分）', price: '¥6,600' },
    ]
  },
  {
    id: 'arrangement',
    name: 'ヘアセット',
    nameEn: 'Hair Arrange',
    items: [
      { id: 'set-basic', name: 'ヘアセット', price: '¥5,500' },
      { id: 'set-seijin', name: '成人式ヘアセット', price: '¥8,800' },
      { id: 'set-bridal', name: 'ブライダルヘアメイク', price: '¥33,000〜' },
    ]
  },
  {
    id: 'set-menu',
    name: 'セットメニュー',
    nameEn: 'Set Menu',
    items: [
      { id: 'combo-cut-color', name: 'カット + カラー', price: '¥12,100' },
      { id: 'combo-cut-perm', name: 'カット + パーマ', price: '¥12,100' },
      { id: 'combo-cut-improve', name: 'カット + 髪質改善', price: '¥14,300' },
      { id: 'combo-full', name: '美髪フルコース', price: '¥27,500' },
    ]
  },
];

const timeSlots = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

const stylists = [
  { id: '', name: '指名なし', image: null, description: 'スタッフにお任せ' },
  { id: 'yamada', name: '山田 花子', image: '/person1.png', description: 'Director' },
  { id: 'sato', name: '佐藤 美咲', image: '/person2.png', description: 'Top Stylist' },
];

export default function ContactPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    menu: '',
    stylist: '',
    message: '',
    isFirstVisit: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMenuSelect = (menuId: string) => {
    setFormData((prev) => ({ ...prev, menu: menuId }));
  };

  const handleStylistSelect = (stylistId: string) => {
    setFormData((prev) => ({ ...prev, stylist: stylistId }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({ ...prev, time }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const canProceedStep1 = formData.menu !== '';
  const canProceedStep2 = formData.date !== '' && formData.time !== '';
  const canSubmit = formData.name !== '' && formData.email !== '' && formData.phone !== '';

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-[var(--color-cream)] pt-32">
      {/* Hero */}
      <section className="container-wide pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-subheading mb-4">Reservation</p>
          <h1 className="text-display mb-6">ご予約</h1>
          <div className="divider-line mx-auto mb-8" />
        </motion.div>
      </section>

      {/* Quick Call CTA */}
      <section className="container-wide pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[var(--color-charcoal)] text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-400 mb-1">お急ぎの方・当日予約はお電話で</p>
            <p className="text-2xl font-light tracking-wider">03-1234-5678</p>
          </div>
          <a
            href="tel:03-1234-5678"
            className="flex items-center gap-2 px-8 py-3 bg-white text-[var(--color-charcoal)] text-sm tracking-wider hover:bg-[var(--color-sage)] hover:text-white transition-all"
          >
            <Phone className="w-4 h-4" />
            今すぐ電話する
          </a>
        </motion.div>
      </section>

      <div className="container-wide pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white p-6 md:p-10"
            >
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-[var(--color-sage)] flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-[family-name:var(--font-serif)] mb-4">
                    ご予約ありがとうございます
                  </h2>
                  <p className="text-[var(--color-warm-gray)] mb-2">
                    ご予約内容を確認後、<br />
                    確認のお電話またはメールをお送りいたします。
                  </p>
                  <p className="text-sm text-[var(--color-warm-gray)] mb-8">
                    ※24時間以内にご連絡がない場合は、お手数ですがお電話ください。
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setStep(1);
                      setExpandedCategory(null);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        date: '',
                        time: '',
                        menu: '',
                        stylist: '',
                        message: '',
                        isFirstVisit: '',
                      });
                    }}
                    className="btn-outline"
                  >
                    新しい予約をする
                  </button>
                </div>
              ) : (
                <>
                  {/* Progress Steps */}
                  <div className="flex items-center justify-center mb-10">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                            step >= s
                              ? 'bg-[var(--color-sage)] text-white'
                              : 'bg-[var(--color-cream)] text-[var(--color-warm-gray)]'
                          }`}
                        >
                          {step > s ? <Check className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && (
                          <div
                            className={`w-16 md:w-24 h-[2px] transition-all ${
                              step > s ? 'bg-[var(--color-sage)]' : 'bg-[var(--color-cream)]'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-8 text-xs text-[var(--color-warm-gray)] mb-10">
                    <span className={step >= 1 ? 'text-[var(--color-charcoal)]' : ''}>メニュー選択</span>
                    <span className={step >= 2 ? 'text-[var(--color-charcoal)]' : ''}>日時選択</span>
                    <span className={step >= 3 ? 'text-[var(--color-charcoal)]' : ''}>お客様情報</span>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                      {/* Step 1: Menu Selection */}
                      {step === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <h2 className="text-xl font-[family-name:var(--font-serif)] mb-2 text-center">
                            ご希望のメニューを選択してください
                          </h2>
                          <p className="text-sm text-[var(--color-warm-gray)] text-center mb-8">
                            カテゴリを選択すると詳細メニューが表示されます
                          </p>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-6">
                            {menuCategories.map((category) => {
                              const isExpanded = expandedCategory === category.id;
                              const hasSelectedItem = category.items.some(item => item.id === formData.menu);

                              return (
                                <button
                                  key={category.id}
                                  type="button"
                                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                                  className={`p-3 sm:p-4 text-center transition-all duration-300 border ${
                                    isExpanded
                                      ? 'border-[var(--color-charcoal)] bg-[var(--color-charcoal)] text-white'
                                      : hasSelectedItem
                                        ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5'
                                        : 'border-[var(--color-light-gray)] hover:border-[var(--color-sage-light)] bg-white'
                                  }`}
                                >
                                  <span className="block text-[10px] sm:text-xs tracking-[0.05em] sm:tracking-[0.1em] uppercase text-[var(--color-warm-gray)] mb-1 truncate" style={{ color: isExpanded ? 'rgba(255,255,255,0.6)' : undefined }}>
                                    {category.nameEn}
                                  </span>
                                  <span className={`block text-sm sm:text-base font-medium truncate ${isExpanded ? 'text-white' : 'text-[var(--color-charcoal)]'}`}>
                                    {category.name}
                                  </span>
                                  {hasSelectedItem && !isExpanded && (
                                    <Check className="w-4 h-4 text-[var(--color-sage)] mx-auto mt-1 sm:mt-2" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Expanded Menu Items */}
                          <AnimatePresence mode="wait">
                            {expandedCategory && (
                              <motion.div
                                key={expandedCategory}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mb-8 overflow-hidden"
                              >
                                <div className="bg-[var(--color-cream)] p-6">
                                  <h3 className="text-sm tracking-[0.1em] uppercase text-[var(--color-warm-gray)] mb-4">
                                    {menuCategories.find(c => c.id === expandedCategory)?.nameEn}
                                  </h3>
                                  <div className="space-y-2">
                                    {menuCategories.find(c => c.id === expandedCategory)?.items.map((item) => (
                                      <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                          handleMenuSelect(item.id);
                                          setExpandedCategory(null);
                                        }}
                                        className={`w-full p-4 text-left transition-all duration-200 flex justify-between items-center ${
                                          formData.menu === item.id
                                            ? 'bg-[var(--color-sage)] text-white'
                                            : 'bg-white hover:bg-[var(--color-sage)]/5 border border-transparent hover:border-[var(--color-sage-light)]'
                                        }`}
                                      >
                                        <span className="font-medium">{item.name}</span>
                                        <span className={formData.menu === item.id ? 'text-white/80' : 'text-[var(--color-gold)]'}>
                                          {item.price}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Selected Menu Display */}
                          {formData.menu && !expandedCategory && (
                            <div className="mb-8 p-4 border border-[var(--color-sage)] bg-white">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-xs text-[var(--color-warm-gray)] mb-1">選択中のメニュー</p>
                                  <p className="font-medium text-[var(--color-charcoal)]">
                                    {menuCategories.flatMap(c => c.items).find(item => item.id === formData.menu)?.name}
                                  </p>
                                </div>
                                <p className="text-lg text-[var(--color-gold)] font-light">
                                  {menuCategories.flatMap(c => c.items).find(item => item.id === formData.menu)?.price}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Stylist Selection */}
                          <h3 className="text-lg font-[family-name:var(--font-serif)] mb-4 text-center">
                            スタイリストを選択（任意）
                          </h3>
                          <div className="flex flex-wrap justify-center gap-4 mb-8">
                            {stylists.map((stylist) => (
                              <button
                                key={stylist.id}
                                type="button"
                                onClick={() => handleStylistSelect(stylist.id)}
                                className={`p-4 text-center transition-all border-2 w-32 ${
                                  formData.stylist === stylist.id
                                    ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5'
                                    : 'border-[var(--color-cream)] hover:border-[var(--color-sage-light)]'
                                }`}
                              >
                                {stylist.image ? (
                                  <div className="relative w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden">
                                    <Image src={stylist.image} alt={stylist.name} fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-[var(--color-cream)] flex items-center justify-center">
                                    <User className="w-8 h-8 text-[var(--color-warm-gray)]" />
                                  </div>
                                )}
                                <p className="text-sm font-medium">{stylist.name}</p>
                                <p className="text-xs text-[var(--color-warm-gray)]">{stylist.description}</p>
                              </button>
                            ))}
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={nextStep}
                              disabled={!canProceedStep1}
                              className={`flex items-center gap-2 px-8 py-3 text-sm tracking-wider transition-all ${
                                canProceedStep1
                                  ? 'bg-[var(--color-charcoal)] text-white hover:bg-[var(--color-sage)]'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              次へ：日時選択
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Step 2: Date & Time Selection */}
                      {step === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <h2 className="text-xl font-[family-name:var(--font-serif)] mb-6 text-center">
                            ご希望の日時を選択してください
                          </h2>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Date Selection */}
                            <div>
                              <label className="block text-sm font-medium mb-3">
                                <Calendar className="w-4 h-4 inline mr-2" />
                                ご希望日 <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                min={getMinDate()}
                                required
                                className="w-full px-4 py-4 bg-[var(--color-cream)] border-2 border-transparent focus:border-[var(--color-sage)] outline-none transition-all text-lg"
                              />
                              <p className="text-xs text-[var(--color-warm-gray)] mt-2">
                                ※定休日：毎週火曜日
                              </p>
                            </div>

                            {/* Time Selection */}
                            <div>
                              <label className="block text-sm font-medium mb-3">
                                <Clock className="w-4 h-4 inline mr-2" />
                                ご希望時間 <span className="text-red-400">*</span>
                              </label>
                              <div className="grid grid-cols-4 gap-2">
                                {timeSlots.map((time) => (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => handleTimeSelect(time)}
                                    className={`py-2 text-sm transition-all ${
                                      formData.time === time
                                        ? 'bg-[var(--color-sage)] text-white'
                                        : 'bg-[var(--color-cream)] hover:bg-[var(--color-sage-light)] hover:text-white'
                                    }`}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <button
                              type="button"
                              onClick={prevStep}
                              className="flex items-center gap-2 px-6 py-3 text-sm text-[var(--color-warm-gray)] hover:text-[var(--color-charcoal)] transition-all"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              戻る
                            </button>
                            <button
                              type="button"
                              onClick={nextStep}
                              disabled={!canProceedStep2}
                              className={`flex items-center gap-2 px-8 py-3 text-sm tracking-wider transition-all ${
                                canProceedStep2
                                  ? 'bg-[var(--color-charcoal)] text-white hover:bg-[var(--color-sage)]'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              次へ：お客様情報
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Step 3: Customer Information */}
                      {step === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <h2 className="text-xl font-[family-name:var(--font-serif)] mb-6 text-center">
                            お客様情報を入力してください
                          </h2>

                          {/* Summary */}
                          <div className="bg-[var(--color-cream)] p-4 mb-8">
                            <p className="text-sm text-[var(--color-warm-gray)] mb-2">ご予約内容</p>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <span className="bg-white px-3 py-1">
                                {menuCategories.flatMap(c => c.items).find(item => item.id === formData.menu)?.name}
                              </span>
                              <span className="bg-white px-3 py-1">
                                {formData.date} {formData.time}
                              </span>
                              {formData.stylist && (
                                <span className="bg-white px-3 py-1">
                                  {stylists.find(s => s.id === formData.stylist)?.name}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-6">
                            {/* First Visit */}
                            <div>
                              <label className="block text-sm font-medium mb-3">
                                ご来店について <span className="text-red-400">*</span>
                              </label>
                              <div className="flex gap-4">
                                <label className={`flex-1 p-4 text-center cursor-pointer border-2 transition-all ${
                                  formData.isFirstVisit === 'first'
                                    ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5'
                                    : 'border-[var(--color-cream)]'
                                }`}>
                                  <input
                                    type="radio"
                                    name="isFirstVisit"
                                    value="first"
                                    checked={formData.isFirstVisit === 'first'}
                                    onChange={handleChange}
                                    className="sr-only"
                                  />
                                  <span>初めて</span>
                                </label>
                                <label className={`flex-1 p-4 text-center cursor-pointer border-2 transition-all ${
                                  formData.isFirstVisit === 'repeat'
                                    ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5'
                                    : 'border-[var(--color-cream)]'
                                }`}>
                                  <input
                                    type="radio"
                                    name="isFirstVisit"
                                    value="repeat"
                                    checked={formData.isFirstVisit === 'repeat'}
                                    onChange={handleChange}
                                    className="sr-only"
                                  />
                                  <span>2回目以降</span>
                                </label>
                              </div>
                            </div>

                            {/* Name */}
                            <div>
                              <label htmlFor="name" className="block text-sm font-medium mb-2">
                                お名前 <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-[var(--color-cream)] border-2 border-transparent focus:border-[var(--color-sage)] outline-none transition-all"
                                placeholder="山田 花子"
                              />
                            </div>

                            {/* Phone */}
                            <div>
                              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                                電話番号 <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-[var(--color-cream)] border-2 border-transparent focus:border-[var(--color-sage)] outline-none transition-all"
                                placeholder="090-1234-5678"
                              />
                              <p className="text-xs text-[var(--color-warm-gray)] mt-1">
                                ※確認のお電話をさせていただく場合がございます
                              </p>
                            </div>

                            {/* Email */}
                            <div>
                              <label htmlFor="email" className="block text-sm font-medium mb-2">
                                メールアドレス <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-[var(--color-cream)] border-2 border-transparent focus:border-[var(--color-sage)] outline-none transition-all"
                                placeholder="example@email.com"
                              />
                            </div>

                            {/* Message */}
                            <div>
                              <label htmlFor="message" className="block text-sm font-medium mb-2">
                                ご要望・ご質問（任意）
                              </label>
                              <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 bg-[var(--color-cream)] border-2 border-transparent focus:border-[var(--color-sage)] outline-none transition-all resize-none"
                                placeholder="髪のお悩みやご希望のスタイルなど"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between mt-8">
                            <button
                              type="button"
                              onClick={prevStep}
                              className="flex items-center gap-2 px-6 py-3 text-sm text-[var(--color-warm-gray)] hover:text-[var(--color-charcoal)] transition-all"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              戻る
                            </button>
                            <button
                              type="submit"
                              disabled={!canSubmit}
                              className={`flex items-center gap-2 px-10 py-4 text-sm tracking-wider transition-all ${
                                canSubmit
                                  ? 'bg-[var(--color-sage)] text-white hover:bg-[var(--color-sage-dark)]'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <Send className="w-4 h-4" />
                              予約を確定する
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </>
              )}
            </motion.div>
          </div>

          {/* Sidebar Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-6"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/full.png"
                alt="LUMINA HAIR STUDIO サロン内装"
                fill
                className="object-cover"
              />
            </div>

            {/* Contact Info */}
            <div className="bg-white p-6">
              <h3 className="text-lg font-[family-name:var(--font-serif)] mb-4">サロン情報</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[var(--color-sage)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p>東京都渋谷区神宮前1-2-3</p>
                    <p className="text-[var(--color-warm-gray)]">表参道駅 A1出口より徒歩3分</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[var(--color-sage)] mt-0.5 flex-shrink-0" />
                  <a href="tel:03-1234-5678" className="hover:text-[var(--color-sage)] transition-colors">
                    03-1234-5678
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[var(--color-sage)] mt-0.5 flex-shrink-0" />
                  <a href="mailto:info@lumina-hair.jp" className="hover:text-[var(--color-sage)] transition-colors">
                    info@lumina-hair.jp
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[var(--color-sage)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p>平日 10:00 - 20:00</p>
                    <p>土日祝 9:00 - 19:00</p>
                    <p className="text-[var(--color-warm-gray)]">定休日: 毎週火曜日</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="bg-[var(--color-cream-dark)] p-6 text-sm">
              <h4 className="font-medium mb-2">ご予約について</h4>
              <ul className="space-y-2 text-[var(--color-warm-gray)]">
                <li>・当日予約はお電話にて承ります</li>
                <li>・キャンセルは前日までにご連絡ください</li>
                <li>・初回の方はカウンセリングのお時間をいただきます</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
