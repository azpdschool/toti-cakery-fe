import { useTranslation } from 'react-i18next';
import { MessageCircleQuestion } from 'lucide-react';
import { useWhatsApp } from '@/context/WhatsAppContext';

export function PaymentSupportCard() {
  const { t } = useTranslation();
  const { whatsappNumber } = useWhatsApp();

  const handleSupport = () => {
    if (whatsappNumber) {
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Halo Toti Cakery, saya butuh bantuan mengenai pembayaran pesanan saya.')}`, '_blank');
    }
  };

  return (
    <div className="rounded-2xl border border-[#ead8ca] bg-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-[#f8f4f0] text-[#d85b30]">
          <MessageCircleQuestion className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-bold text-[#4b2417]">{t('checkout.need_help')}</h4>
        </div>
      </div>
      <button
        onClick={handleSupport}
        className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white border border-[#d85b30] text-[#d85b30] text-sm font-bold hover:bg-[#d85b30] hover:text-white transition"
      >
        {t('checkout.chat_support')}
      </button>
    </div>
  );
}
