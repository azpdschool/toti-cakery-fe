import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import id from '@/locales/id/translation.json'
import en from '@/locales/en/translation.json'
import { LANG_KEY } from '@/constants'

i18n.use(initReactI18next).init({
  resources: {
    id: { translation: id },
    en: { translation: en },
  },
  lng: localStorage.getItem(LANG_KEY) ?? 'id',
  fallbackLng: 'id',
  interpolation: {
    escapeValue: false,
  },
})

if (typeof document !== 'undefined') {
  const current = (localStorage.getItem(LANG_KEY) ?? 'id').startsWith('en') ? 'en' : 'id'
  document.documentElement.lang = current
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng?.startsWith('en') ? 'en' : 'id'
  })
}

export default i18n
