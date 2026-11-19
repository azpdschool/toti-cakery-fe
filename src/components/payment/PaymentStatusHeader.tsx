import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

interface PaymentStatusHeaderProps {
  status: string;
  isPolling?: boolean;
}

export function PaymentStatusHeader({ status, isPolling }: PaymentStatusHeaderProps) {
  const { t } = useTranslation();

  const normalizedStatus = status.toLowerCase();

  let icon = <Clock className="h-5 w-5 text-toti-warning" />;
  let color = 'text-toti-brick-hover bg-toti-honey/20 ring-1 ring-inset ring-toti-warning/30 border-transparent';
  let label = t('checkout.waiting_for_payment');

  if (normalizedStatus === 'paid' || normalizedStatus === 'success') {
    icon = <CheckCircle className="h-5 w-5 text-toti-success" />;
    color = 'text-toti-ink bg-toti-success/20 ring-1 ring-inset ring-toti-success/30 border-transparent';
    label = t('checkout.payment_successful');
  } else if (normalizedStatus === 'processing' || normalizedStatus === 'partial') {
    icon = <RefreshCw className="h-5 w-5 text-toti-secondary animate-spin" />;
    color = 'text-toti-secondary bg-toti-alt ring-1 ring-inset ring-toti-divider/40 border-transparent';
    label = t('checkout.payment_processing');
  } else if (normalizedStatus === 'failed' || normalizedStatus === 'expired') {
    icon = <XCircle className="h-5 w-5 text-toti-error" />;
    color = 'text-toti-error bg-toti-error/15 ring-1 ring-inset ring-toti-error/25 border-transparent';
    label = t('checkout.payment_failed');
  } else if (normalizedStatus === 'refunded') {
    icon = <XCircle className="h-5 w-5 text-toti-error" />;
    color = 'text-toti-error bg-toti-error/15 ring-1 ring-inset ring-toti-error/25 border-transparent';
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
