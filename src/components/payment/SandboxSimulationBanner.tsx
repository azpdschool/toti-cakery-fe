import { useTranslation } from 'react-i18next';
import { AlertTriangle, ExternalLink, HelpCircle, Terminal } from 'lucide-react';
import { isMidtransSandbox, MIDTRANS_SIMULATOR_URL } from '@/utils/midtransEnv';

interface SandboxProps {
  method?: 'qris' | 'bank_transfer';
  qrisUrl?: string | null;
}


/**
 * 2. Compact inline callout banner inside QRIS and Virtual Account cards.
 */
export function SandboxInlineAction({ method, qrisUrl }: SandboxProps) {
  const { t } = useTranslation();

  if (!isMidtransSandbox(qrisUrl)) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-left text-xs shadow-xs">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-amber-900">
              {t('checkout.sandbox_inline_title', 'Simulasi Pembayaran (Uang Mainan)')}
            </p>
            <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
              Sandbox
            </span>
          </div>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            {method === 'bank_transfer'
              ? t(
                  'checkout.sandbox_inline_va_desc',
                  'Jangan transfer melalui m-Banking/ATM sungguhan. Gunakan simulator resmi Midtrans untuk menyelesaikan pembayaran.'
                )
              : t(
                  'checkout.sandbox_inline_qris_desc',
                  'Jangan scan dengan aplikasi dompet digital asli. Gunakan simulator resmi Midtrans untuk menyelesaikan pembayaran.'
                )}
          </p>
          <div className="pt-1">
            <a
              href={MIDTRANS_SIMULATOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-amber-700 shadow-xs"
            >
              <span>{t('checkout.sandbox_open_simulator', 'Buka Simulator')}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Step-by-step tutorial box placed directly above the payment instructions.
 */
export function SandboxTutorialBox({ method, qrisUrl }: SandboxProps) {
  const { t } = useTranslation();

  if (!isMidtransSandbox(qrisUrl)) {
    return null;
  }

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border-2 border-amber-300 bg-amber-50/90 shadow-sm">
      <div className="flex items-center justify-between border-b border-amber-200 bg-amber-100/70 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-amber-800" />
          <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
            {t('checkout.sandbox_tutorial_title', 'Panduan Simulasi Pembayaran (Midtrans Sandbox)')}
          </h4>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
          <HelpCircle className="h-3 w-3" />
          {t('checkout.sandbox_badge', 'Mode Simulasi')}
        </span>
      </div>

      <div className="p-4 text-xs text-amber-950 space-y-3">
        <p className="text-amber-900 leading-relaxed font-medium">
          {t(
            'checkout.sandbox_tutorial_intro',
            'Ikuti 4 langkah mudah berikut untuk mensimulasikan pembayaran tanpa uang asli:'
          )}
        </p>

        {method === 'bank_transfer' ? (
          <ol className="space-y-2 list-none">
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-[11px] text-amber-900">
                1
              </span>
              <span className="leading-snug">
                {t('checkout.sandbox_steps_va_1', 'Salin Nomor Virtual Account BCA yang tertera pada kartu di atas.')}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-[11px] text-amber-900">
                2
              </span>
              <span className="leading-snug">
                {t('checkout.sandbox_steps_va_2_prefix', 'Buka situs ')}
                <a
                  href={MIDTRANS_SIMULATOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-bold text-amber-900 underline underline-offset-2 hover:text-amber-700"
                >
                  Midtrans Sandbox Simulator
                  <ExternalLink className="h-3 w-3 inline" />
                </a>
                .
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-[11px] text-amber-900">
                3
              </span>
              <span className="leading-snug">
                {t(
                  'checkout.sandbox_steps_va_3',
                  'Pada simulator, pilih menu Virtual Account -> BCA Virtual Account.'
                )}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-[11px] text-amber-900">
                4
              </span>
              <span className="leading-snug">
                {t(
                  'checkout.sandbox_steps_va_4',
                  'Tempel (paste) Nomor VA pada kolom Virtual Account Number, klik Inquire, lalu klik Pay hingga berhasil.'
                )}
              </span>
            </li>
          </ol>
        ) : (
          <ol className="space-y-2 list-none">
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-[11px] text-amber-900">
                1
              </span>
              <span className="leading-snug">
                {t(
                  'checkout.sandbox_steps_qris_1',
                  'Klik kanan atau tekan lama pada gambar kode QRIS di atas lalu pilih Salin Alamat Gambar (Copy Image Address) atau klik tombol Unduh QR.'
                )}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-[11px] text-amber-900">
                2
              </span>
              <span className="leading-snug">
                {t('checkout.sandbox_steps_qris_2_prefix', 'Buka situs ')}
                <a
                  href={MIDTRANS_SIMULATOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-bold text-amber-900 underline underline-offset-2 hover:text-amber-700"
                >
                  Midtrans Sandbox Simulator
                  <ExternalLink className="h-3 w-3 inline" />
                </a>
                .
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-[11px] text-amber-900">
                3
              </span>
              <span className="leading-snug">
                {t(
                  'checkout.sandbox_steps_qris_3',
                  'Pilih menu QRIS, lalu tempel URL gambar QRIS atau unggah gambar yang telah diunduh.'
                )}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-[11px] text-amber-900">
                4
              </span>
              <span className="leading-snug">
                {t(
                  'checkout.sandbox_steps_qris_4',
                  'Klik Scan QR lalu klik Pay untuk menyelesaikan simulasi pembayaran.'
                )}
              </span>
            </li>
          </ol>
        )}

        <div className="pt-2">
          <a
            href={MIDTRANS_SIMULATOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white transition hover:bg-amber-700 shadow-xs"
          >
            <span>{t('checkout.sandbox_open_simulator', 'Buka Midtrans Sandbox Simulator')}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
