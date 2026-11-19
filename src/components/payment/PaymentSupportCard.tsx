import { useTranslation } from 'react-i18next';
import { MessageCircleQuestion } from 'lucide-react';
import { useWhatsApp } from '@/context/WhatsAppContext';

export function PaymentSupportCard() {
  const { t, i18n } = useTranslation();
  const { getWhatsAppUrl } = useWhatsApp();

  const handleSupport = () => {
    const isEn = i18n.language === 'en';
    const message = isEn
      ? 'Hello Toti Cakery, I need assistance regarding my order payment.'
      : 'Halo Toti Cakery, saya butuh bantuan mengenai pembayaran pesanan saya.';
    const url = getWhatsAppUrl(message);
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="rounded-2xl border border-toti-divider bg-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-toti-cream text-toti-brick">
          <MessageCircleQuestion className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-bold text-toti-ink">{t('checkout.need_help')}</h4>
        </div>
      </div>
      <button
        onClick={handleSupport}
        className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white border border-toti-brick text-toti-brick text-sm font-bold hover:bg-toti-brick hover:text-white transition"
      >
        {t('checkout.chat_support')}
      </button>
    </div>
  );
}
