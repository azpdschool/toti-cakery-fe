import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'

const sellerI18n = i18n.cloneInstance({
  lng: 'en',
  fallbackLng: 'en',
})

export function SellerLocaleProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={sellerI18n}>{children}</I18nextProvider>
}
