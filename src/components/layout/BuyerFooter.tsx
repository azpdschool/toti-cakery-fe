import { Link } from 'react-router-dom'
import instagramIcon from '@/assets/instagram.png'
import whatsappIcon from '@/assets/whatsapp.png'
import { LOGO_URL } from '@/constants'
import { useWhatsApp } from '@/context/WhatsAppContext'
import { useTranslation } from 'react-i18next'

export function BuyerFooter() {
  const { t } = useTranslation()
  const { whatsappNumberDisplay, whatsappUrl } = useWhatsApp()
  return (
    <footer className="mt-10 border-t border-[#f0ded2] bg-[#fff7f1]">
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
            <p className="mt-3 text-xs text-[#6f5448]">
              {t('footer.motto')}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#4b2417]">{t('footer.about_us')}</h4>
            <ul className="mt-3 space-y-2 text-xs text-[#6f5448]">
              <li>
                <Link to="/produk" className="hover:text-[#d85b30] transition">
                  {t('footer.products')}
                </Link>
              </li>
              <li>
                <Link to="/our-store" className="hover:text-[#d85b30] transition">
                  {t('footer.our_store')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#4b2417]">{t('footer.help')}</h4>
            <ul className="mt-3 space-y-2 text-xs text-[#6f5448]">
              <li>
                <Link to="/cara-berbelanja" className="hover:text-[#d85b30] transition">
                  {t('footer.how_to_shop')}
                </Link>
              </li>
              <li>
                <Link to="/panduan-pembayaran" className="hover:text-[#d85b30] transition">
                  {t('footer.payment_guide')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#d85b30] transition">
                  {t('footer.faq')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#4b2417]">{t('footer.policies')}</h4>
            <ul className="mt-3 space-y-2 text-xs text-[#6f5448]">
              <li>
                <Link to="/pengiriman" className="hover:text-[#d85b30] transition">
                  {t('footer.shipping')}
                </Link>
              </li>
              <li>
                <Link to="/privasi" className="hover:text-[#d85b30] transition">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/syarat-ketentuan" className="hover:text-[#d85b30] transition">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#4b2417]">{t('footer.social_media')}</h4>
            <div className="mt-3 space-y-3">
              <a
                href="https://instagram.com/toti.cakery"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition hover:opacity-80"
              >
                <img src={instagramIcon} alt="Instagram" className="h-7 w-7" />
                <span className="text-xs text-[#6f5448] hover:text-[#d85b30]">
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
                <span className="text-xs text-[#6f5448] hover:text-[#d85b30]">
                  {whatsappNumberDisplay}
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#ead8ca] pt-5 text-center text-xs text-[#8b7166]">
          COPYRIGHT ©2026 TOTI CAKERY <br className="sm:hidden" /> ALL RIGHTS RESERVED
        </div>
      </div>
    </footer>
  )
}
