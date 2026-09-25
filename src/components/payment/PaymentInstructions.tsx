import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PaymentInstructionsProps {
  method: 'qris' | 'bank_transfer';
}

export function PaymentInstructions({ method }: PaymentInstructionsProps) {
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState<string | null>('bca_mobile');

  if (method === 'qris') {
    const steps = t('checkout.qris_instructions', { returnObjects: true }) as string[];
    return (
      <div className="rounded-2xl border border-[#ead8ca] bg-white overflow-hidden shadow-sm">
        <div className="bg-[#f8f4f0] p-4 border-b border-[#ead8ca]">
          <h3 className="font-bold text-[#4b2417]">{t('checkout.how_to_pay')}</h3>
        </div>
        <div className="p-4">
          <ol className="list-decimal list-inside space-y-3 text-sm text-[#6f5448]">
            {Array.isArray(steps) && steps.map((step, idx) => (
              <li key={idx} className="pl-1">
                <span className="text-[#4b2417] font-medium">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'bca_mobile', title: t('checkout.bca_mobile'), steps: t('checkout.bca_mobile_steps', { returnObjects: true }) as string[] },
    { id: 'atm_bca', title: t('checkout.atm_bca'), steps: t('checkout.atm_bca_steps', { returnObjects: true }) as string[] },
    { id: 'internet_banking', title: t('checkout.internet_banking'), steps: t('checkout.internet_banking_steps', { returnObjects: true }) as string[] },
  ];

  return (
    <div className="rounded-2xl border border-[#ead8ca] bg-white overflow-hidden shadow-sm">
      <div className="bg-[#f8f4f0] p-4 border-b border-[#ead8ca]">
        <h3 className="font-bold text-[#4b2417]">{t('checkout.how_to_pay')}</h3>
      </div>
      
      <div className="divide-y divide-[#ead8ca]">
        {sections.map((section) => {
          const isOpen = openSection === section.id;
          return (
            <div key={section.id}>
              <button
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition text-left focus:outline-none"
              >
                <span className="font-semibold text-[#4b2417]">{section.title}</span>
                {isOpen ? <ChevronUp className="h-5 w-5 text-[#d85b30]" /> : <ChevronDown className="h-5 w-5 text-[#6f5448]" />}
              </button>
              
              {isOpen && (
                <div className="px-4 pb-4 pt-1 bg-white">
                  <ol className="list-decimal list-inside space-y-2 text-sm text-[#6f5448]">
                    {Array.isArray(section.steps) && section.steps.map((step, idx) => (
                      <li key={idx} className="pl-1 leading-relaxed">
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
