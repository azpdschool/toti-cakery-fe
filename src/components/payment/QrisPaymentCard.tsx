import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { formatRupiah } from '@/services/productService';
import { toast } from 'react-hot-toast';

interface QrisPaymentCardProps {
  qrisUrl: string;
  amount: number;
}

export function QrisPaymentCard({ qrisUrl, amount }: QrisPaymentCardProps) {
  const { t } = useTranslation();

  const handleDownload = async () => {
    try {
      const response = await fetch(qrisUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'QRIS-Payment.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('checkout.qr_downloaded'));
    } catch (error) {
      console.error('Failed to download QR', error);
      // Fallback: just open in new tab
      window.open(qrisUrl, '_blank');
    }
  };

  return (
    <div className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm text-center">
      <div className="inline-flex items-center justify-center rounded-lg bg-[#ED0226]/10 px-4 py-2 mb-4">
        <span className="font-black text-[#ED0226] tracking-wide">QRIS</span>
      </div>
      
      <p className="text-sm font-semibold text-[#6f5448] mb-4">
        {t('checkout.qris')}
      </p>

      <div className="flex justify-center mb-6">
        <div className="p-4 bg-white border-2 border-[#ead8ca] rounded-xl shadow-sm inline-block max-w-full">
          <img src={qrisUrl} alt="QRIS Code" className="w-48 h-48 sm:w-64 sm:h-64 object-contain" />
        </div>
      </div>

      <div className="rounded-xl bg-[#f8f4f0] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#ead8ca] mb-6">
        <div className="text-left">
          <p className="text-xs text-[#6f5448] font-semibold">{t('checkout.due_now')}</p>
          <p className="text-xl font-black text-[#d85b30]">{formatRupiah(amount)}</p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-white border-2 border-[#d85b30] text-sm font-bold text-[#d85b30] hover:bg-[#d85b30]/5 transition"
      >
        <Download className="h-5 w-5" />
        {t('checkout.download_qr')}
      </button>
    </div>
  );
}
