import { useTranslation } from 'react-i18next';
import { formatRupiah } from '@/services/productService';

interface PaymentSummaryCardProps {
  orderNumber: string;
  total: number;
  paymentPreference: 'lunas' | 'dp';
  amountDue: number;
  amountPaid?: number;
}

export function PaymentSummaryCard({
  orderNumber,
  total,
  paymentPreference,
  amountDue,
  amountPaid,
}: PaymentSummaryCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-[#ead8ca] bg-white p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-[#6f5448]">Order Ref</span>
        <span className="text-sm font-black text-[#4b2417]">{orderNumber}</span>
      </div>
      
      <div className="space-y-2 border-t border-[#ead8ca] pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-[#6f5448]">{t('checkout.total')}</span>
          <span className="font-semibold text-[#4b2417]">{formatRupiah(total)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-[#6f5448]">{t('checkout.payment_preference')}</span>
          <span className="font-semibold capitalize text-[#4b2417]">{paymentPreference === 'dp' ? t('checkout.pay_dp_label') : t('checkout.pay_full_label')}</span>
        </div>

        {amountPaid !== undefined && amountPaid > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#6f5448]">Sudah Dibayar</span>
            <span className="font-semibold text-[#4b2417]">{formatRupiah(amountPaid)}</span>
          </div>
        )}

        <div className="flex justify-between items-center rounded-xl bg-[#f8f4f0] p-3 mt-4 border border-[#ead8ca]">
          <span className="text-sm font-bold text-[#6f5448]">{t('checkout.due_now')}</span>
          <span className="text-2xl font-black text-[#d85b30]">{formatRupiah(amountDue)}</span>
        </div>
      </div>
    </div>
  );
}
