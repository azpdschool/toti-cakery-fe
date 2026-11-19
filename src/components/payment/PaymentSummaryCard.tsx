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
    <div className="rounded-2xl border border-toti-divider bg-white p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-toti-secondary">Order Ref</span>
        <span className="text-sm font-black text-toti-ink">{orderNumber}</span>
      </div>
      
      <div className="space-y-2 border-t border-toti-divider pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-toti-secondary">{t('checkout.total')}</span>
          <span className="font-semibold text-toti-ink">{formatRupiah(total)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-toti-secondary">{t('checkout.payment_preference')}</span>
          <span className="font-semibold capitalize text-toti-ink">{paymentPreference === 'dp' ? t('checkout.pay_dp_label') : t('checkout.pay_full_label')}</span>
        </div>

        {amountPaid !== undefined && amountPaid > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-toti-secondary">Sudah Dibayar</span>
            <span className="font-semibold text-toti-ink">{formatRupiah(amountPaid)}</span>
          </div>
        )}

        <div className="flex justify-between items-center rounded-xl bg-toti-cream p-3 mt-4 border border-toti-beige">
          <span className="text-sm font-bold text-toti-secondary">{t('checkout.due_now')}</span>
          <span className="text-2xl font-black text-toti-brick">{formatRupiah(amountDue)}</span>
        </div>
      </div>
    </div>
  );
}
