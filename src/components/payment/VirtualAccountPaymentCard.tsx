import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '@/services/productService';
import { toast } from 'react-hot-toast';

interface VirtualAccountPaymentCardProps {
  bankName: string;
  vaNumber: string;
  amount: number;
}

export function VirtualAccountPaymentCard({ bankName, vaNumber, amount }: VirtualAccountPaymentCardProps) {
  const { t } = useTranslation();
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const handleCopyVa = () => {
    navigator.clipboard.writeText(vaNumber);
    setCopiedVa(true);
    toast.success(t('checkout.copy_va_success'));
    setTimeout(() => setCopiedVa(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmount(true);
    toast.success(t('checkout.copy_amount_success'));
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm text-center">
      <div className="inline-flex items-center justify-center rounded-lg bg-[#0066AE]/10 px-4 py-2 mb-4">
        <span className="font-black text-[#0066AE] tracking-wide">
          {bankName === 'BCA' ? 'BCA' : bankName}
        </span>
      </div>
      
      <p className="text-sm font-semibold text-[#6f5448] mb-1">
        Virtual Account {bankName === 'BCA' ? 'BCA' : bankName}
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
        <p className="text-2xl sm:text-3xl font-mono font-black text-[#4b2417] tracking-wider break-all text-center">{vaNumber}</p>
        <button
          onClick={handleCopyVa}
          className="p-2 rounded-lg bg-[#f8f4f0] text-[#6f5448] hover:text-[#d85b30] hover:bg-[#d85b30]/10 transition shrink-0"
          title={t('checkout.copy')}
        >
          {copiedVa ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
        </button>
      </div>

      <div className="rounded-xl bg-[#f8f4f0] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#ead8ca]">
        <div className="text-left">
          <p className="text-xs text-[#6f5448] font-semibold">{t('checkout.due_now')}</p>
          <p className="text-xl font-black text-[#d85b30]">{formatRupiah(amount)}</p>
        </div>
        <button
          onClick={handleCopyAmount}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#d0bfaf] text-sm font-bold text-[#6f5448] hover:text-[#d85b30] transition w-full sm:w-auto justify-center"
        >
          {copiedAmount ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          {t('checkout.copy')}
        </button>
      </div>
    </div>
  );
}
