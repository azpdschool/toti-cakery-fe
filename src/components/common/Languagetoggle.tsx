import { useTranslation } from 'react-i18next'
import { LANG_KEY } from '@/constants'

export function LanguageToggle() {
  const { i18n } = useTranslation()
  const isID = i18n.language === 'id'

  const toggle = () => {
    const next = isID ? 'en' : 'id'

    i18n.changeLanguage(next)
    localStorage.setItem(LANG_KEY, next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      aria-label="Ganti bahasa"
    >
      <span className={isID ? 'font-bold text-gray-900' : ''}>ID</span>
      <span className="text-gray-300">|</span>
      <span className={!isID ? 'font-bold text-gray-900' : ''}>EN</span>
    </button>
  )
}
