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

// ============================================================================
// 1. HOW TO SHOP PAGE
// ============================================================================

export function HowToShopPage() {
  const { t, i18n } = useTranslation();
  const { getWhatsAppUrl } = useWhatsApp();
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const customWaMessage = i18n.language === 'en'
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
    <div className="min-h-screen bg-[#fffaf5] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d85b30]/10 mb-4 text-[#d85b30]">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-[#4b2417] sm:text-4xl">
            {t('info.how_to_shop.page_title')}
          </h1>
          <p className="mt-3 text-base text-[#6f5448] max-w-2xl mx-auto">
            {t('info.how_to_shop.page_subtitle')}
          </p>
        </div>

        {/* Video Tutorial Card */}
        <div className="mb-12 overflow-hidden rounded-3xl border border-[#ead8ca] bg-white shadow-md">
          <div className="p-6 border-b border-[#ead8ca]/60 bg-[#FAF5EF] flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d85b30]/15 px-3 py-1 text-xs font-bold text-[#d85b30]">
                {t('info.how_to_shop.video_badge')}
              </span>
              <h2 className="mt-2 text-xl font-bold text-[#4b2417]">
                {t('info.how_to_shop.video_title')}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6f5448]">
              <Clock className="h-4 w-4 text-[#d85b30]" />
              <span>{t('info.how_to_shop.video_duration')}</span>
            </div>
          </div>

          <div className="relative aspect-video w-full bg-[#3A1F16] flex items-center justify-center overflow-hidden">
            {!isPlayingVideo ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/70 via-black/40 to-black/20 p-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsPlayingVideo(true)}
                  aria-label={t('info.how_to_shop.play_video')}
                  className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-[#d85b30] text-white shadow-xl transition hover:scale-110 hover:bg-[#c04e28] focus:outline-none focus:ring-4 focus:ring-[#d85b30]/40"
                >
                  <Play className="h-8 w-8 fill-current translate-x-0.5" />
                </button>
                <p className="mt-4 text-sm font-semibold text-white/90">
                  {t('info.how_to_shop.video_hint')}
                </p>
              </div>
            ) : (
              <iframe
                title={t('info.how_to_shop.video_title')}
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>

        {/* Written Step-by-Step Guide */}
        <div className="space-y-6">
          <div className="text-center sm:text-left mb-6">
            <h2 className="text-2xl font-black text-[#4b2417]">
              {t('info.how_to_shop.steps_header')}
            </h2>
            <p className="text-sm text-[#6f5448] mt-1">
              {t('info.how_to_shop.steps_subheader')}
            </p>
          </div>

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="group flex flex-col sm:flex-row items-start gap-5 rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#d85b30]/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d85b30] text-lg font-black text-white shadow-sm">
                  {step.num}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-[#d85b30]" />
                    <h3 className="text-lg font-bold text-[#4b2417]">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#6f5448]">{step.desc}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {step.isWhatsApp ? (
                      <a
                        href={getWhatsAppUrl(customWaMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1EBE57] transition"
                      >
                        <span>{step.actionText}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : step.isAnchor ? (
                      <a
                        href={step.actionLink}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#c04e28] transition"
                      >
                        <span>{step.actionText}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <Link
                        to={step.actionLink!}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#c04e28] transition"
                      >
                        <span>{step.actionText}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
    <div className="min-h-screen bg-[#fffaf5] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d85b30]/10 mb-4 text-[#d85b30]">
            <CreditCard className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-[#4b2417] sm:text-4xl">
            {t('info.payment_guide.page_title')}
          </h1>
          <p className="mt-3 text-base text-[#6f5448] max-w-2xl mx-auto">
            {t('info.payment_guide.page_subtitle')}
          </p>
        </div>

        {/* 1. Payment Preferences: Full vs 50% DP */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-[#4b2417]">
            {t('info.payment_guide.pref_header')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm hover:shadow-md transition">
              <span className="rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-bold">
                100% Full Payment
              </span>
              <h3 className="mt-3 text-lg font-bold text-[#4b2417]">
                {t('info.payment_guide.full_title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6f5448]">
                {t('info.payment_guide.full_desc')}
              </p>
            </div>

            <div className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm hover:shadow-md transition">
              <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-bold">
                50% Down Payment (DP)
              </span>
              <h3 className="mt-3 text-lg font-bold text-[#4b2417]">
                {t('info.payment_guide.dp_title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6f5448]">
                {t('info.payment_guide.dp_desc')}
              </p>
              <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{t('info.payment_guide.dp_deadline_warning')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Supported Payment Methods */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-[#4b2417]">
            {t('info.payment_guide.methods_header')}
          </h2>

          {/* QRIS */}
          <div className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#d85b30]/10 flex items-center justify-center text-[#d85b30]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#4b2417]">{t('checkout.qris')}</h3>
                <p className="text-xs text-[#6f5448]">{t('info.payment_guide.qris_apps')}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-[#6f5448] leading-relaxed">
              {t('info.payment_guide.qris_desc')}
            </p>
          </div>

          {/* BCA Virtual Account */}
          <div className="rounded-2xl border border-[#ead8ca] bg-white overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#ead8ca] bg-[#FAF5EF]">
              <h3 className="text-lg font-bold text-[#4b2417]">{t('checkout.bca_va')}</h3>
              <p className="text-xs text-[#6f5448] mt-1">{t('info.payment_guide.va_desc')}</p>
            </div>

            <div className="divide-y divide-[#ead8ca]">
              {bcaSteps.map((sec) => {
                const isOpen = openVaSection === sec.id;
                return (
                  <div key={sec.id}>
                    <button
                      type="button"
                      onClick={() => setOpenVaSection(isOpen ? null : sec.id)}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition text-left focus:outline-none"
                    >
                      <span className="font-semibold text-sm text-[#4b2417]">{sec.title}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-[#d85b30]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6f5448]" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 bg-[#fffaf5]/50">
                        <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-[#6f5448]">
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
        </section>

        {/* 3. Automatic Verification & PDF Invoice */}
        <section className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700 shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#4b2417]">
                {t('info.payment_guide.verification_title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6f5448]">
                {t('info.payment_guide.verification_desc')}
              </p>
            </div>
          </div>
        </section>
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
    <div className="min-h-screen bg-[#fffaf5] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d85b30]/10 mb-4 text-[#d85b30]">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-[#4b2417] sm:text-4xl">
            {t('info.shipping.page_title')}
          </h1>
          <p className="mt-3 text-base text-[#6f5448] max-w-2xl mx-auto">
            {t('info.shipping.page_subtitle')}
          </p>
        </div>

        {/* 1. The 3 Shipping Methods */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-[#4b2417]">
            {t('info.shipping.methods_header')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {methods.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-10 w-10 rounded-xl bg-[#FAF0E6] flex items-center justify-center text-[#d85b30]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-[#FAF0E6] px-2.5 py-0.5 text-[11px] font-bold text-[#9B4A2F]">
                        {m.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#4b2417]">{m.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm text-[#6f5448] leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#ead8ca]/60 text-xs font-semibold text-[#8b7166]">
                    {m.fee}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. Fulfillment Scheduling Rule */}
        <section className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#d85b30]/15 flex items-center justify-center text-[#d85b30] shrink-0">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#4b2417]">
                {t('info.shipping.schedule_title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6f5448]">
                {t('info.shipping.schedule_desc')}
              </p>
            </div>
          </div>
        </section>

        {/* 3. Order Tracking Stages */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-[#4b2417]">
            {t('info.shipping.tracking_header')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-4">
            {stages.map((st) => (
              <div
                key={st.num}
                className="rounded-2xl border border-[#ead8ca] bg-white p-5 shadow-sm text-center sm:text-left"
              >
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#d85b30] text-xs font-black text-white mb-2">
                  {st.num}
                </div>
                <h4 className="font-bold text-sm text-[#4b2417]">{st.title}</h4>
                <p className="mt-1 text-xs text-[#6f5448] leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================================================================
// 4. PRIVACY POLICY PAGE
// ============================================================================

export function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#fffaf5] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d85b30]/10 mb-4 text-[#d85b30]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-[#4b2417] sm:text-4xl">
            {t('info.privacy.page_title')}
          </h1>
          <p className="mt-3 text-base text-[#6f5448] max-w-2xl mx-auto">
            {t('info.privacy.page_subtitle')}
          </p>
        </div>

        <div className="rounded-3xl border border-[#ead8ca] bg-white p-8 shadow-sm space-y-8 text-[#6f5448] leading-relaxed text-sm sm:text-base">
          <div>
            <h2 className="text-xl font-bold text-[#4b2417] mb-3">
              1. {t('info.privacy.collect_title')}
            </h2>
            <p>{t('info.privacy.collect_desc')}</p>
            <ul className="mt-3 list-disc list-inside space-y-1.5 pl-2 text-sm">
              <li>{t('info.privacy.collect_item1')}</li>
              <li>{t('info.privacy.collect_item2')}</li>
              <li>{t('info.privacy.collect_item3')}</li>
              <li>{t('info.privacy.collect_item4')}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#4b2417] mb-3">
              2. {t('info.privacy.use_title')}
            </h2>
            <p>{t('info.privacy.use_desc')}</p>
            <ul className="mt-3 list-disc list-inside space-y-1.5 pl-2 text-sm">
              <li>{t('info.privacy.use_item1')}</li>
              <li>{t('info.privacy.use_item2')}</li>
              <li>{t('info.privacy.use_item3')}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#4b2417] mb-3">
              3. {t('info.privacy.security_title')}
            </h2>
            <p>{t('info.privacy.security_desc')}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#4b2417] mb-3">
              4. {t('info.privacy.third_party_title')}
            </h2>
            <p>{t('info.privacy.third_party_desc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. TERMS & CONDITIONS PAGE
// ============================================================================

export function TermsAndConditionsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#fffaf5] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d85b30]/10 mb-4 text-[#d85b30]">
            <FileText className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-[#4b2417] sm:text-4xl">
            {t('info.terms.page_title')}
          </h1>
          <p className="mt-3 text-base text-[#6f5448] max-w-2xl mx-auto">
            {t('info.terms.page_subtitle')}
          </p>
        </div>

        <div className="rounded-3xl border border-[#ead8ca] bg-white p-8 shadow-sm space-y-8 text-[#6f5448] leading-relaxed text-sm sm:text-base">
          <div>
            <h2 className="text-xl font-bold text-[#4b2417] mb-3">
              1. {t('info.terms.booking_title')}
            </h2>
            <p>{t('info.terms.booking_desc')}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#4b2417] mb-3">
              2. {t('info.terms.payment_title')}
            </h2>
            <p>{t('info.terms.payment_desc')}</p>
          </div>

          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <h2 className="text-xl font-bold text-amber-950 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              3. {t('info.terms.cancellation_title')}
            </h2>
            <p className="text-amber-900 leading-relaxed">
              {t('info.terms.cancellation_desc')}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#4b2417] mb-3">
              4. {t('info.terms.custom_title')}
            </h2>
            <p>{t('info.terms.custom_desc')}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#4b2417] mb-3">
              5. {t('info.terms.handling_title')}
            </h2>
            <p>{t('info.terms.handling_desc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
