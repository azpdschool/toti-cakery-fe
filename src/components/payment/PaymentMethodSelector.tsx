import { useTranslation } from 'react-i18next';
import { QrCode, Building } from 'lucide-react';
import { isMidtransSandbox } from '@/utils/midtransEnv';

interface PaymentMethodSelectorProps {
  selectedMethod: 'qris' | 'bank_transfer';
  onSelect: (method: 'qris' | 'bank_transfer') => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({ selectedMethod, onSelect, disabled }: PaymentMethodSelectorProps) {
  const { t } = useTranslation();
  const isSandbox = isMidtransSandbox();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-toti-ink">{t('checkout.payment_method')}</h3>
        {isSandbox && (
          <span className="inline-flex items-center gap-1 rounded-full text-toti-brick-hover bg-toti-honey/20 ring-1 ring-inset ring-toti-warning/30 px-2.5 py-0.5 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-toti-warning animate-pulse" />
            {t('checkout.sandbox_badge', 'Mode Simulasi')}
          </span>
        )}
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect('qris')}
          className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition ${
            selectedMethod === 'qris'
              ? 'border-toti-brick bg-toti-brick/5 shadow-sm'
              : 'border-toti-beige bg-white hover:border-toti-divider'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2">
            <QrCode className={`h-5 w-5 ${selectedMethod === 'qris' ? 'text-toti-brick' : 'text-toti-secondary'}`} />
            <span className={`font-bold ${selectedMethod === 'qris' ? 'text-toti-brick' : 'text-toti-ink'}`}>
              {t('checkout.qris')}
            </span>
          </div>
          <span className="text-xs text-toti-secondary">{t('checkout.qris_desc')}</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect('bank_transfer')}
          className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition ${
            selectedMethod === 'bank_transfer'
              ? 'border-toti-brick bg-toti-brick/5 shadow-sm'
              : 'border-toti-beige bg-white hover:border-toti-divider'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2">
            <Building className={`h-5 w-5 ${selectedMethod === 'bank_transfer' ? 'text-toti-brick' : 'text-toti-secondary'}`} />
            <span className={`font-bold ${selectedMethod === 'bank_transfer' ? 'text-toti-brick' : 'text-toti-ink'}`}>
              {t('checkout.bca_va')}
            </span>
          </div>
          <span className="text-xs text-toti-secondary">{t('checkout.bca_va_desc')}</span>
        </button>
      </div>
    </div>
  );
}
