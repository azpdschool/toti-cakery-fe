import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SandboxTutorialBox } from './SandboxSimulationBanner';

interface PaymentInstructionsProps {
  method: 'qris' | 'bank_transfer';
  qrisUrl?: string | null;
}

export function PaymentInstructions({ method, qrisUrl }: PaymentInstructionsProps) {
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState<string | null>('bca_mobile');

  if (method === 'qris') {
    const steps = t('checkout.qris_instructions', { returnObjects: true }) as string[];
    return (
      <div className="space-y-4">
        <SandboxTutorialBox method="qris" qrisUrl={qrisUrl} />
        <div className="rounded-2xl border border-toti-divider bg-white overflow-hidden shadow-sm">
        <div className="bg-toti-cream p-4 border-b border-toti-divider">
          <h3 className="font-bold text-toti-ink">{t('checkout.how_to_pay')}</h3>
        </div>
        <div className="p-4">
          <ol className="list-decimal list-inside space-y-3 text-sm text-toti-secondary">
            {Array.isArray(steps) && steps.map((step, idx) => (
              <li key={idx} className="pl-1">
                <span className="text-toti-ink font-medium">{step}</span>
              </li>
            ))}
          </ol>
        </div>
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
    <div className="space-y-4">
      <SandboxTutorialBox method="bank_transfer" qrisUrl={qrisUrl} />
      <div className="rounded-2xl border border-toti-divider bg-white overflow-hidden shadow-sm">
        <div className="bg-toti-cream p-4 border-b border-toti-divider">
          <h3 className="font-bold text-toti-ink">{t('checkout.how_to_pay')}</h3>
        </div>
        
        <div className="divide-y divide-toti-beige">
        {sections.map((section) => {
          const isOpen = openSection === section.id;
          return (
            <div key={section.id}>
              <button
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-toti-cream/50 transition text-left focus:outline-none"
              >
                <span className="font-semibold text-toti-ink">{section.title}</span>
                {isOpen ? <ChevronUp className="h-5 w-5 text-toti-brick" /> : <ChevronDown className="h-5 w-5 text-toti-secondary" />}
              </button>
              
              {isOpen && (
                <div className="px-4 pb-4 pt-1 bg-white">
                  <ol className="list-decimal list-inside space-y-2 text-sm text-toti-secondary">
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
  </div>
  );
}
