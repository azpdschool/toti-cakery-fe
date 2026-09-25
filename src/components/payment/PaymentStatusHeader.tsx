import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

interface PaymentStatusHeaderProps {
  status: string;
  isPolling?: boolean;
}

export function PaymentStatusHeader({ status, isPolling }: PaymentStatusHeaderProps) {
  const { t } = useTranslation();

  const normalizedStatus = status.toLowerCase();

  let icon = <Clock className="h-5 w-5 text-yellow-600" />;
  let color = 'bg-yellow-50 text-yellow-800 border-yellow-200';
  let label = t('checkout.waiting_for_payment');

  if (normalizedStatus === 'paid' || normalizedStatus === 'success') {
    icon = <CheckCircle className="h-5 w-5 text-green-600" />;
    color = 'bg-green-50 text-green-800 border-green-200';
    label = t('checkout.payment_successful');
  } else if (normalizedStatus === 'processing' || normalizedStatus === 'partial') {
    icon = <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
    color = 'bg-blue-50 text-blue-800 border-blue-200';
    label = t('checkout.payment_processing');
  } else if (normalizedStatus === 'failed' || normalizedStatus === 'expired') {
    icon = <XCircle className="h-5 w-5 text-red-600" />;
    color = 'bg-red-50 text-red-800 border-red-200';
    label = t('checkout.payment_failed');
  } else if (normalizedStatus === 'refunded') {
    icon = <XCircle className="h-5 w-5 text-gray-600" />;
    color = 'bg-gray-50 text-gray-800 border-gray-200';
    label = t('checkout.refunded');
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-xl border ${color} mb-6`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="font-bold">{label}</span>
      </div>
      {isPolling && (normalizedStatus === 'pending' || normalizedStatus === 'unpaid') && (
        <p className="text-xs opacity-80 mt-1 flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          {t('checkout.payment_status_checking')}
        </p>
      )}
    </div>
  );
}
