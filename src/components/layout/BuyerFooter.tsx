import { Link, useLocation, useNavigate } from 'react-router-dom'
import instagramIcon from '@/assets/instagram.png'
import whatsappIcon from '@/assets/whatsapp.png'
import { LOGO_URL, ROUTES } from '@/constants'
import { useWhatsApp } from '@/context/WhatsAppContext'
import { useTranslation } from 'react-i18next'

export function BuyerFooter() {
  const { t } = useTranslation()
  const { whatsappNumberDisplay, whatsappUrl } = useWhatsApp()
  const location = useLocation()
  const navigate = useNavigate()

  const handleOurStoreClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (location.pathname === '/') {
      const el = document.getElementById('our-store')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate('/#our-store')
    }
  }

  const handleTopClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="mt-10 border-t border-[#D0BFAF] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="flex items-center gap-2">
              <img
                src={LOGO_URL}
                alt="Toti Cakery"
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="mt-3 text-xs text-[#6B4A3C]">
              {t('footer.motto')}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#3A1F16]">{t('footer.about_us')}</h4>
            <ul className="mt-3 space-y-2 text-xs text-[#6B4A3C]">
              <li>
                <Link
                  to={ROUTES.CATALOG}
                  onClick={handleTopClick}
                  className="hover:text-[#9B4A2F] transition"
                >
                  {t('footer.products')}
                </Link>
              </li>
              <li>
                <a
                  href="/#our-store"
                  onClick={handleOurStoreClick}
                  className="hover:text-[#9B4A2F] transition"
                >
                  {t('footer.our_store')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#3A1F16]">{t('footer.help')}</h4>
            <ul className="mt-3 space-y-2 text-xs text-[#6B4A3C]">
              <li>
                <Link
                  to={ROUTES.HOW_TO_SHOP}
                  onClick={handleTopClick}
                  className="hover:text-[#9B4A2F] transition"
                >
                  {t('footer.how_to_shop')}
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.PAYMENT_GUIDE}
                  onClick={handleTopClick}
                  className="hover:text-[#9B4A2F] transition"
                >
                  {t('footer.payment_guide')}
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.BUYER_FAQ}
                  onClick={handleTopClick}
                  className="hover:text-[#9B4A2F] transition"
                >
                  {t('footer.faq')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#3A1F16]">{t('footer.policies')}</h4>
            <ul className="mt-3 space-y-2 text-xs text-[#6B4A3C]">
              <li>
                <Link
                  to={ROUTES.SHIPPING}
                  onClick={handleTopClick}
                  className="hover:text-[#9B4A2F] transition"
                >
                  {t('footer.shipping')}
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.PRIVACY}
                  onClick={handleTopClick}
                  className="hover:text-[#9B4A2F] transition"
                >
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.TERMS}
                  onClick={handleTopClick}
                  className="hover:text-[#9B4A2F] transition"
                >
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#3A1F16]">{t('footer.social_media')}</h4>
            <div className="mt-3 space-y-3">
              <a
                href="https://instagram.com/toti.cakery"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition hover:opacity-80"
              >
                <img src={instagramIcon} alt="Instagram" className="h-7 w-7" />
                <span className="text-xs text-[#6B4A3C] hover:text-[#9B4A2F]">
                  @toti.cakery
                </span>
              </a>

              <a
                href={whatsappUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition hover:opacity-80"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="h-7 w-7" />
                <span className="text-xs text-[#6B4A3C] hover:text-[#9B4A2F]">
                  {whatsappNumberDisplay}
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#D0BFAF] pt-5 text-center text-xs text-[#9C8478]">
          COPYRIGHT ©2026 TOTI CAKERY <br className="sm:hidden" /> ALL RIGHTS RESERVED
        </div>
      </div>
    </footer>
  )
}