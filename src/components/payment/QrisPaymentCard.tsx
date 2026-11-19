import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { formatRupiah } from '@/services/productService';
import { toast } from 'react-hot-toast';
import { SandboxInlineAction } from './SandboxSimulationBanner';

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
    <div className="rounded-2xl border border-toti-divider bg-white p-6 shadow-sm text-center">
      <SandboxInlineAction method="qris" qrisUrl={qrisUrl} />

      <div className="inline-flex items-center justify-center rounded-lg bg-toti-error/10 px-4 py-2 mb-4">
        <span className="font-black text-toti-error tracking-wide">QRIS</span>
      </div>
      
      <p className="text-sm font-semibold text-toti-secondary mb-4">
        {t('checkout.qris')}
      </p>

      <div className="flex justify-center mb-6">
        <div className="p-4 bg-white border-2 border-toti-beige rounded-xl shadow-sm inline-block max-w-full">
          <img src={qrisUrl} alt="QRIS Code" className="w-48 h-48 sm:w-64 sm:h-64 object-contain" />
        </div>
      </div>

      <div className="rounded-xl bg-toti-cream p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-toti-beige mb-6">
        <div className="text-left">
          <p className="text-xs text-toti-secondary font-semibold">{t('checkout.due_now')}</p>
          <p className="text-xl font-black text-toti-brick">{formatRupiah(amount)}</p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-white border-2 border-toti-brick text-sm font-bold text-toti-brick hover:bg-toti-brick/5 transition"
      >
        <Download className="h-5 w-5" />
        {t('checkout.download_qr')}
      </button>
    </div>
  );
}
