import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  CreditCard,
  Truck,
  ShieldCheck,
  FileText,
  Play,
  Search,
  Sparkles,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { useWhatsApp } from '@/context/WhatsAppContext';
import {
  ScrollProgressBar,
  ScrollReveal,
  ScrollParallaxHero,
  useActiveSectionSpy,
} from '@/components/common/ScrollMotion';

// ============================================================================
// 1. HOW TO SHOP PAGE
// ============================================================================

export function HowToShopPage() {
  const { t, i18n } = useTranslation();
  const { getWhatsAppUrl } = useWhatsApp();
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const customWaMessage =
    i18n.language === 'en'
      ? 'Hello Toti Cakery! I would like to inquire about ordering a custom cake.'
      : 'Halo Toti Cakery! Saya ingin bertanya mengenai pemesanan custom cake.';

  const steps = [
    {
      num: 1,
      title: t('info.how_to_shop.step1_title'),
      desc: t('info.how_to_shop.step1_desc'),
      actionText: t('info.how_to_shop.step1_action'),
      actionLink: ROUTES.HOME,
      icon: Sparkles,
    },
    {
      num: 2,
      title: t('info.how_to_shop.step2_title'),
      desc: t('info.how_to_shop.step2_desc'),
      actionText: t('info.how_to_shop.step2_action'),
      actionLink: ROUTES.CATALOG,
      icon: Search,
    },
    {
      num: 3,
      title: t('info.how_to_shop.step3_title'),
      desc: t('info.how_to_shop.step3_desc'),
      actionText: t('info.how_to_shop.step3_action'),
      actionLink: ROUTES.CATALOG,
      icon: ShoppingBag,
    },
    {
      num: 4,
      title: t('info.how_to_shop.step4_title'),
      desc: t('info.how_to_shop.step4_desc'),
      isWhatsApp: true,
      actionText: t('info.how_to_shop.step4_action'),
      icon: Sparkles,
    },
    {
      num: 5,
      title: t('info.how_to_shop.step5_title'),
      desc: t('info.how_to_shop.step5_desc'),
      actionText: t('info.how_to_shop.step5_action'),
      actionLink: '/#our-store',
      isAnchor: true,
      icon: MapPin,
    },
  ];

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <ScrollProgressBar />

      <div className="mx-auto max-w-7xl">
        {/* Editorial Header */}
        <ScrollParallaxHero
          icon={ShoppingBag}
          title={t('info.how_to_shop.page_title')}
          subtitle={t('info.how_to_shop.page_subtitle')}
        />

        {/* Clean Video Tutorial Block */}
        <ScrollReveal direction="scale" className="mb-14 sm:mb-16">
          <div className="max-w-4xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d85b30]/15 px-3 py-1 text-xs font-bold text-[#d85b30]">
                {t('info.how_to_shop.video_badge')}
              </span>
              <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-[#3A1F16] font-display">
                {t('info.how_to_shop.video_title')}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#6f5448]">
              <Clock className="h-4 w-4 text-[#d85b30]" />
              <span>{t('info.how_to_shop.video_duration')}</span>
            </div>
          </div>

          <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-[#E8DCCB] bg-white shadow-sm max-w-4xl mx-auto mb-12 flex items-center justify-center">
            {!isPlayingVideo ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/75 via-black/45 to-black/25 p-6 text-center">
                <div className="relative flex items-center justify-center mb-1">
                  <button
                    type="button"
                    onClick={() => setIsPlayingVideo(true)}
                    aria-label={t('info.how_to_shop.play_video')}
                    className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-[#d85b30] text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-[#c04e28] focus:outline-none focus:ring-4 focus:ring-[#d85b30]/40 cursor-pointer"
                  >
                    <Play className="h-8 w-8 fill-current translate-x-0.5" />
                  </button>
                </div>
                <p className="mt-4 text-sm font-semibold text-white/95 tracking-wide">
                  {t('info.how_to_shop.video_hint')}
                </p>
              </div>
            ) : (
              <iframe
                title={t('info.how_to_shop.video_title')}
                src="https://drive.google.com/file/d/1sO8aP5IyBLI8XnYMh4MTmW3BGMukRfj3/preview"
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            )}
          </div>
        </ScrollReveal>

        {/* Written Step-by-Step Guide - Body Shop Style Grid */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#3A1F16] font-display">
              {t('info.how_to_shop.steps_header')}
            </h2>
            <p className="text-sm sm:text-base text-[#6f5448] mt-1 font-sans">
              {t('info.how_to_shop.steps_subheader')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <ScrollReveal
                  key={step.num}
                  delay={idx * 60}
                  direction="up"
                  className="h-full"
                >
                  <div
                    id={`shop-step-${step.num}`}
                    className="h-full rounded-3xl border border-[#E8DCCB] bg-white p-7 shadow-sm transition-all duration-300 hover:border-[#E0A04E] hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: Dark Circular Step Badge & Step Type Icon */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-8 h-8 rounded-full bg-[#3A1F16] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {step.num}
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-[#FAF0E6] flex items-center justify-center text-[#d85b30]">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>

                      {/* Minimalist Wireframe Mockup Frame (Body Shop Style) */}
                      <div className="w-full h-28 rounded-2xl border border-dashed border-[#E8DCCB] bg-[#FAF5EF]/75 mb-5 p-4 flex flex-col justify-between overflow-hidden">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#D0BFAF]" />
                            <span className="w-2 h-2 rounded-full bg-[#E8DCCB]" />
                            <span className="w-2 h-2 rounded-full bg-[#E8DCCB]" />
                          </div>
                          <span className="text-[10px] font-semibold text-[#8b7166] uppercase tracking-wider">
                            Step 0{step.num}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-2 w-3/4 rounded bg-[#E8DCCB]" />
                          <div className="h-2 w-1/2 rounded bg-[#E8DCCB]/60" />
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-[#3A1F16] font-display">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#6f5448] font-sans">
                        {step.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E8DCCB]/60 flex items-center">
                      {step.isWhatsApp ? (
                        <a
                          href={getWhatsAppUrl(customWaMessage)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1EBE57] hover:shadow-md transition-all duration-300 active:scale-95 cursor-pointer"
                        >
                          <span>{step.actionText}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : step.isAnchor ? (
                        <a
                          href={step.actionLink}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#c04e28] hover:shadow-md transition-all duration-300 active:scale-95 cursor-pointer"
                        >
                          <span>{step.actionText}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link
                          to={step.actionLink!}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#c04e28] hover:shadow-md transition-all duration-300 active:scale-95 cursor-pointer"
                        >
                          <span>{step.actionText}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================================================================
// 2. PAYMENT GUIDE PAGE
// ============================================================================

export function PaymentGuidePage() {
  const { t } = useTranslation();
  const [openVaSection, setOpenVaSection] = useState<string | null>('bca_mobile');

  const bcaSteps = [
    {
      id: 'bca_mobile',
      title: t('checkout.bca_mobile'),
      steps: t('checkout.bca_mobile_steps', { returnObjects: true }) as string[],
    },
    {
      id: 'atm_bca',
      title: t('checkout.atm_bca'),
      steps: t('checkout.atm_bca_steps', { returnObjects: true }) as string[],
    },
    {
      id: 'internet_banking',
      title: t('checkout.internet_banking'),
      steps: t('checkout.internet_banking_steps', { returnObjects: true }) as string[],
    },
  ];

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <ScrollProgressBar />

      <div className="mx-auto max-w-7xl space-y-12">
        {/* Editorial Header */}
        <ScrollParallaxHero
          icon={CreditCard}
          title={t('info.payment_guide.page_title')}
          subtitle={t('info.payment_guide.page_subtitle')}
        />

        {/* 1. Payment Preferences: Full vs 50% DP */}
        <section className="space-y-6">
          <ScrollReveal direction="up">
            <h2 className="text-2xl sm:text-3xl font-black text-[#3A1F16] font-display">
              {t('info.payment_guide.pref_header')}
            </h2>
          </ScrollReveal>

          <div className="grid gap-6 md:grid-cols-2">
            <ScrollReveal delay={0} direction="up" className="h-full">
              <div className="h-full rounded-3xl border border-[#E8DCCB] bg-white p-7 sm:p-8 shadow-sm hover:shadow-md hover:border-[#E0A04E] transition-all duration-300 flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 px-3.5 py-1 text-xs font-bold">
                    100% Full Payment
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-[#3A1F16] font-display">
                    {t('info.payment_guide.full_title')}
                  </h3>
                  <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-[#6f5448]">
                    {t('info.payment_guide.full_desc')}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={90} direction="up" className="h-full">
              <div className="h-full rounded-3xl border border-[#E8DCCB] bg-white p-7 sm:p-8 shadow-sm hover:shadow-md hover:border-[#E0A04E] transition-all duration-300 flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-200 px-3.5 py-1 text-xs font-bold">
                    50% Down Payment (DP)
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-[#3A1F16] font-display">
                    {t('info.payment_guide.dp_title')}
                  </h3>
                  <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-[#6f5448]">
                    {t('info.payment_guide.dp_desc')}
                  </p>
                </div>
                <div className="mt-5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm text-rose-800 font-semibold flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{t('info.payment_guide.dp_deadline_warning')}</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 2. Supported Payment Methods (Bento Grid) */}
        <section className="space-y-6">
          <ScrollReveal direction="up">
            <h2 className="text-2xl sm:text-3xl font-black text-[#3A1F16] font-display">
              {t('info.payment_guide.methods_header')}
            </h2>
          </ScrollReveal>

          <div className="grid gap-6 lg:grid-cols-2 items-start">
            {/* QRIS */}
            <ScrollReveal delay={50} direction="up" className="h-full">
              <div className="h-full rounded-3xl border border-[#E8DCCB] bg-white p-7 sm:p-8 shadow-sm hover:shadow-md hover:border-[#E0A04E] transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#d85b30]/10 flex items-center justify-center text-[#d85b30] shrink-0">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#3A1F16] font-display">{t('checkout.qris')}</h3>
                      <p className="text-xs sm:text-sm text-[#6f5448]">{t('info.payment_guide.qris_apps')}</p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-[#6f5448] leading-relaxed">
                    {t('info.payment_guide.qris_desc')}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* BCA Virtual Account */}
            <ScrollReveal delay={100} direction="up" className="h-full">
              <div className="h-full rounded-3xl border border-[#E8DCCB] bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-[#E0A04E] transition-all duration-300 flex flex-col">
                <div className="p-6 sm:p-7 border-b border-[#E8DCCB] bg-[#FAF5EF]">
                  <div className="flex items-center gap-3.5 mb-1">
                    <div className="h-10 w-10 rounded-xl bg-[#9B4A2F]/10 flex items-center justify-center text-[#9B4A2F] shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-[#3A1F16] font-display">{t('checkout.bca_va')}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#6f5448] mt-1.5">{t('info.payment_guide.va_desc')}</p>
                </div>

                <div className="divide-y divide-[#E8DCCB]">
                  {bcaSteps.map((sec) => {
                    const isOpen = openVaSection === sec.id;
                    return (
                      <div key={sec.id}>
                        <button
                          type="button"
                          onClick={() => setOpenVaSection(isOpen ? null : sec.id)}
                          className="w-full flex items-center justify-between p-5 bg-white hover:bg-[#FAF5EF] transition-colors text-left focus:outline-none cursor-pointer"
                          aria-expanded={isOpen}
                        >
                          <span className="font-semibold text-sm sm:text-base text-[#3A1F16]">{sec.title}</span>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-[#d85b30] transition-transform duration-200" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[#6f5448] transition-transform duration-200" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-6 pb-6 pt-3 bg-toti-cream/60 border-t border-[#E8DCCB]/50 animate-in fade-in duration-200">
                            <ol className="list-decimal list-inside space-y-2.5 text-xs sm:text-sm text-[#6f5448]">
                              {Array.isArray(sec.steps) &&
                                sec.steps.map((st, idx) => (
                                  <li key={idx} className="leading-relaxed pl-1">
                                    {st}
                                  </li>
                                ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 3. Automatic Verification & PDF Invoice */}
        <ScrollReveal direction="scale">
          <section className="rounded-3xl border border-[#E8DCCB] bg-white p-7 sm:p-8 shadow-sm hover:shadow-md hover:border-[#E0A04E] transition-all duration-300">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#3A1F16] font-display">
                  {t('info.payment_guide.verification_title')}
                </h3>
                <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#6f5448]">
                  {t('info.payment_guide.verification_desc')}
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </div>
  );
}

// ============================================================================
// 3. SHIPPING PAGE
// ============================================================================

export function ShippingPage() {
  const { t } = useTranslation();

  const methods = [
    {
      title: t('info.shipping.pickup_title'),
      fee: t('info.shipping.pickup_fee'),
      desc: t('info.shipping.pickup_desc'),
      icon: MapPin,
      badge: 'Rp 0 (Free)',
    },
    {
      title: t('info.shipping.toko_title'),
      fee: t('info.shipping.toko_fee'),
      desc: t('info.shipping.toko_desc'),
      icon: Truck,
      badge: t('info.shipping.distance_based'),
    },
    {
      title: t('info.shipping.third_party_title'),
      fee: t('info.shipping.third_party_fee'),
      desc: t('info.shipping.third_party_desc'),
      icon: ExternalLink,
      badge: 'GoSend / GrabExpress',
    },
  ];

  const stages = [
    { num: 1, title: t('info.shipping.stage1_title'), desc: t('info.shipping.stage1_desc') },
    { num: 2, title: t('info.shipping.stage2_title'), desc: t('info.shipping.stage2_desc') },
    { num: 3, title: t('info.shipping.stage3_title'), desc: t('info.shipping.stage3_desc') },
    { num: 4, title: t('info.shipping.stage4_title'), desc: t('info.shipping.stage4_desc') },
  ];

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <ScrollProgressBar />

      <div className="mx-auto max-w-7xl space-y-12">
        {/* Editorial Header */}
        <ScrollParallaxHero
          icon={Truck}
          title={t('info.shipping.page_title')}
          subtitle={t('info.shipping.page_subtitle')}
        />

        {/* 1. The 3 Shipping Methods (Bento Grid) */}
        <section className="space-y-6">
          <ScrollReveal direction="up">
            <h2 className="text-2xl sm:text-3xl font-black text-[#3A1F16] font-display">
              {t('info.shipping.methods_header')}
            </h2>
          </ScrollReveal>

          <div className="grid gap-6 md:grid-cols-3">
            {methods.map((m, idx) => {
              const Icon = m.icon;
              return (
                <ScrollReveal key={idx} delay={idx * 80} direction="up" className="h-full">
                  <div className="h-full rounded-3xl border border-[#E8DCCB] bg-white p-7 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 hover:border-[#E0A04E] transition-all duration-300">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#FAF0E6] flex items-center justify-center text-[#d85b30]">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="rounded-full bg-[#FAF0E6] px-3.5 py-1 text-xs font-bold text-[#9B4A2F]">
                          {m.badge}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#3A1F16] font-display">{m.title}</h3>
                      <p className="mt-2.5 text-sm sm:text-base text-[#6f5448] leading-relaxed">
                        {m.desc}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-[#E8DCCB]/60 text-xs sm:text-sm font-semibold text-[#8b7166]">
                      {m.fee}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </section>

        {/* 2. Fulfillment Scheduling Rule */}
        <ScrollReveal direction="up">
          <section className="rounded-3xl border border-[#E8DCCB] bg-white p-7 sm:p-8 shadow-sm hover:shadow-md hover:border-[#E0A04E] transition-all duration-300">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="h-12 w-12 rounded-2xl bg-[#d85b30]/15 flex items-center justify-center text-[#d85b30] shrink-0">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#3A1F16] font-display">
                  {t('info.shipping.schedule_title')}
                </h3>
                <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#6f5448]">
                  {t('info.shipping.schedule_desc')}
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* 3. Order Tracking Stages (Bento Grid) */}
        <section className="space-y-6">
          <ScrollReveal direction="up">
            <h2 className="text-2xl sm:text-3xl font-black text-[#3A1F16] font-display">
              {t('info.shipping.tracking_header')}
            </h2>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((st, idx) => (
              <ScrollReveal key={st.num} delay={idx * 80} direction="up" className="h-full">
                <div className="h-full rounded-3xl border border-[#E8DCCB] bg-white p-6 sm:p-7 shadow-sm text-left hover:shadow-md hover:border-[#E0A04E] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#9B4A2F]/10 text-xs font-bold text-[#9B4A2F] mb-3.5">
                      {st.num}
                    </div>
                    <h4 className="font-bold text-base text-[#3A1F16] font-display">{st.title}</h4>
                    <p className="mt-2 text-xs sm:text-sm text-[#6f5448] leading-relaxed">{st.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================================================================
// 4. PRIVACY POLICY PAGE (4 Clauses with Desktop Sticky Table of Contents)
// ============================================================================

export function PrivacyPolicyPage() {
  const { t } = useTranslation();

  const sectionIds = [
    'privacy-section-1',
    'privacy-section-2',
    'privacy-section-3',
    'privacy-section-4',
  ];

  const activeId = useActiveSectionSpy(sectionIds);

  const sections = [
    {
      id: 'privacy-section-1',
      title: `1. ${t('info.privacy.collect_title')}`,
      desc: t('info.privacy.collect_desc'),
      items: [
        t('info.privacy.collect_item1'),
        t('info.privacy.collect_item2'),
        t('info.privacy.collect_item3'),
        t('info.privacy.collect_item4'),
      ],
    },
    {
      id: 'privacy-section-2',
      title: `2. ${t('info.privacy.use_title')}`,
      desc: t('info.privacy.use_desc'),
      items: [
        t('info.privacy.use_item1'),
        t('info.privacy.use_item2'),
        t('info.privacy.use_item3'),
      ],
    },
    {
      id: 'privacy-section-3',
      title: `3. ${t('info.privacy.security_title')}`,
      desc: t('info.privacy.security_desc'),
    },
    {
      id: 'privacy-section-4',
      title: `4. ${t('info.privacy.third_party_title')}`,
      desc: t('info.privacy.third_party_desc'),
    },
  ];

  const handleTocClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <ScrollProgressBar />

      <div className="mx-auto max-w-7xl">
        {/* Editorial Header */}
        <ScrollParallaxHero
          icon={ShieldCheck}
          title={t('info.privacy.page_title')}
          subtitle={t('info.privacy.page_subtitle')}
        />

        {/* 2-Column Responsive Layout */}
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 items-start overflow-visible">
          {/* Desktop Sticky Table of Contents */}
          <aside className="hidden lg:block sticky top-[100px] z-20">
            <div className="rounded-2xl border border-[#E8DCCB] bg-white/95 backdrop-blur-md p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#9B4A2F] mb-3 px-2">
                {t('info.privacy.page_title')}
              </p>
              <nav className="space-y-1" aria-label="Table of Contents">
                {sections.map((sec) => {
                  const isActive = activeId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => handleTocClick(sec.id)}
                      className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm rounded-xl transition-all duration-200 block cursor-pointer ${
                        isActive
                          ? 'bg-[#9B4A2F]/10 text-[#9B4A2F] font-bold border-l-2 border-[#9B4A2F] shadow-xs'
                          : 'text-[#6f5448] hover:bg-[#FAF5EF] hover:text-[#3A1F16]'
                      }`}
                    >
                      <span className="line-clamp-1">{sec.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Unified Single-Canvas Legal Content */}
          <main>
            <ScrollReveal direction="up">
              <div className="rounded-3xl border border-[#E8DCCB] bg-white p-8 sm:p-12 shadow-sm space-y-10">
                {sections.map((sec, idx) => (
                  <article
                    key={sec.id}
                    id={sec.id}
                    className={`scroll-mt-28 ${idx !== 0 ? 'pt-8 border-t border-[#E8DCCB]/60' : ''}`}
                  >
                    <h2 className="text-xl sm:text-2xl font-bold text-[#3A1F16] mb-3 font-display">
                      {sec.title}
                    </h2>
                    <p className="text-[#6f5448] leading-relaxed text-sm sm:text-base font-sans">
                      {sec.desc}
                    </p>
                    {sec.items && (
                      <ul className="mt-4 list-disc list-inside space-y-2 pl-2 text-sm sm:text-base text-[#6f5448] font-sans">
                        {sec.items.map((it, iIdx) => (
                          <li key={iIdx} className="leading-relaxed">
                            {it}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </ScrollReveal>
          </main>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. TERMS & CONDITIONS PAGE (5 Clauses with Desktop Sticky Table of Contents)
// ============================================================================

export function TermsAndConditionsPage() {
  const { t } = useTranslation();

  const sectionIds = [
    'terms-section-1',
    'terms-section-2',
    'terms-section-3',
    'terms-section-4',
    'terms-section-5',
  ];

  const activeId = useActiveSectionSpy(sectionIds);

  const sections = [
    {
      id: 'terms-section-1',
      title: `1. ${t('info.terms.booking_title')}`,
      desc: t('info.terms.booking_desc'),
      isAlert: false,
    },
    {
      id: 'terms-section-2',
      title: `2. ${t('info.terms.payment_title')}`,
      desc: t('info.terms.payment_desc'),
      isAlert: false,
    },
    {
      id: 'terms-section-3',
      title: `3. ${t('info.terms.cancellation_title')}`,
      desc: t('info.terms.cancellation_desc'),
      isAlert: true,
    },
    {
      id: 'terms-section-4',
      title: `4. ${t('info.terms.custom_title')}`,
      desc: t('info.terms.custom_desc'),
      isAlert: false,
    },
    {
      id: 'terms-section-5',
      title: `5. ${t('info.terms.handling_title')}`,
      desc: t('info.terms.handling_desc'),
      isAlert: false,
    },
  ];

  const handleTocClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <ScrollProgressBar />

      <div className="mx-auto max-w-7xl">
        {/* Editorial Header */}
        <ScrollParallaxHero
          icon={FileText}
          title={t('info.terms.page_title')}
          subtitle={t('info.terms.page_subtitle')}
        />

        {/* 2-Column Responsive Layout */}
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 items-start overflow-visible">
          {/* Desktop Sticky Table of Contents */}
          <aside className="hidden lg:block sticky top-[100px] z-20">
            <div className="rounded-2xl border border-[#E8DCCB] bg-white/95 backdrop-blur-md p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#9B4A2F] mb-3 px-2">
                {t('info.terms.page_title')}
              </p>
              <nav className="space-y-1" aria-label="Table of Contents">
                {sections.map((sec) => {
                  const isActive = activeId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => handleTocClick(sec.id)}
                      className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm rounded-xl transition-all duration-200 block cursor-pointer ${
                        isActive
                          ? 'bg-[#9B4A2F]/10 text-[#9B4A2F] font-bold border-l-2 border-[#9B4A2F] shadow-xs'
                          : 'text-[#6f5448] hover:bg-[#FAF5EF] hover:text-[#3A1F16]'
                      }`}
                    >
                      <span className="line-clamp-1">{sec.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Unified Single-Canvas Legal Content */}
          <main>
            <ScrollReveal direction="up">
              <div className="rounded-3xl border border-[#E8DCCB] bg-white p-8 sm:p-12 shadow-sm space-y-10">
                {sections.map((sec, idx) => (
                  <article
                    key={sec.id}
                    id={sec.id}
                    className={`scroll-mt-28 ${idx !== 0 ? 'pt-8 border-t border-[#E8DCCB]/60' : ''}`}
                  >
                    {sec.isAlert ? (
                      <div className="rounded-2xl bg-amber-50/90 border border-amber-200/90 p-6 sm:p-7 shadow-xs">
                        <h2 className="text-xl sm:text-2xl font-bold text-amber-950 mb-2.5 flex items-center gap-2 font-display">
                          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                          <span>{sec.title}</span>
                        </h2>
                        <p className="text-amber-900 leading-relaxed text-sm sm:text-base font-sans">
                          {sec.desc}
                        </p>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl sm:text-2xl font-bold text-[#3A1F16] mb-3 font-display">
                          {sec.title}
                        </h2>
                        <p className="text-[#6f5448] leading-relaxed text-sm sm:text-base font-sans">
                          {sec.desc}
                        </p>
                      </>
                    )}
                  </article>
                ))}
              </div>
            </ScrollReveal>
          </main>
        </div>
      </div>
    </div>
  );
}
