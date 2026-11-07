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
        <h3 className="text-sm font-bold text-[#4b2417]">{t('checkout.payment_method')}</h3>
        {isSandbox && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
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
              ? 'border-[#d85b30] bg-[#d85b30]/5 shadow-sm'
              : 'border-[#ead8ca] bg-white hover:border-[#d0bfaf]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2">
            <QrCode className={`h-5 w-5 ${selectedMethod === 'qris' ? 'text-[#d85b30]' : 'text-[#6f5448]'}`} />
            <span className={`font-bold ${selectedMethod === 'qris' ? 'text-[#d85b30]' : 'text-[#4b2417]'}`}>
              {t('checkout.qris')}
            </span>
          </div>
          <span className="text-xs text-[#6f5448]">{t('checkout.qris_desc')}</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect('bank_transfer')}
          className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition ${
            selectedMethod === 'bank_transfer'
              ? 'border-[#d85b30] bg-[#d85b30]/5 shadow-sm'
              : 'border-[#ead8ca] bg-white hover:border-[#d0bfaf]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2">
            <Building className={`h-5 w-5 ${selectedMethod === 'bank_transfer' ? 'text-[#d85b30]' : 'text-[#6f5448]'}`} />
            <span className={`font-bold ${selectedMethod === 'bank_transfer' ? 'text-[#d85b30]' : 'text-[#4b2417]'}`}>
              {t('checkout.bca_va')}
            </span>
          </div>
          <span className="text-xs text-[#6f5448]">{t('checkout.bca_va_desc')}</span>
        </button>
      </div>
    </div>
  );
}
