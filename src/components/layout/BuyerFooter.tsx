import { Link } from 'react-router-dom'
import instagramIcon from '@/assets/instagram.png'
import whatsappIcon from '@/assets/whatsapp.png'

export function BuyerFooter() {
  return (
    <footer className="mt-10 border-t border-[#f0ded2] bg-[#fff7f1]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* Grid 5 kolom di desktop, 2 kolom di tablet, 1 di mobile */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand / Logo */}
          <div>
            <div className="flex items-center gap-2">
              <img
                src="src/assets/logo.png" // ganti dengan path logo utama
                alt="Toti Cakery"
                className="h-10 w-auto"
              />
              {/* Atau pakai teks jika belum ada logo */}
              {/* <span className="text-2xl font-black text-[#d85b30]">TOTI</span>
              <span className="text-lg font-black text-[#4b2417]">CAKERY</span> */}
            </div>
            <p className="mt-3 text-xs text-[#6f5448]">
              Kue berkualitas untuk setiap momen spesial Anda.
            </p>
          </div>

          {/* Tentang Kami */}
          <div>
            <h4 className="text-sm font-black text-[#4b2417]">Tentang Kami</h4>
            <ul className="mt-3 space-y-2 text-xs text-[#6f5448]">
              <li>
                <Link to="/produk" className="hover:text-[#d85b30] transition">
                  Produk
                </Link>
              </li>
              <li>
                <Link to="/our-store" className="hover:text-[#d85b30] transition">
                  Our Store
                </Link>
              </li>
            </ul>
          </div>

          {/* Bantuan */}
          <div>
            <h4 className="text-sm font-black text-[#4b2417]">Bantuan</h4>
            <ul className="mt-3 space-y-2 text-xs text-[#6f5448]">
              <li>
                <Link to="/cara-berbelanja" className="hover:text-[#d85b30] transition">
                  Cara Berbelanja
                </Link>
              </li>
              <li>
                <Link to="/panduan-pembayaran" className="hover:text-[#d85b30] transition">
                  Panduan Pembayaran
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#d85b30] transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Kebijakan */}
          <div>
            <h4 className="text-sm font-black text-[#4b2417]">Kebijakan</h4>
            <ul className="mt-3 space-y-2 text-xs text-[#6f5448]">
              <li>
                <Link to="/pengiriman" className="hover:text-[#d85b30] transition">
                  Pengiriman
                </Link>
              </li>
              <li>
                <Link to="/privasi" className="hover:text-[#d85b30] transition">
                  Privasi
                </Link>
              </li>
              <li>
                <Link to="/syarat-ketentuan" className="hover:text-[#d85b30] transition">
                  Syarat &amp; Ketentuan
                </Link>
              </li>
            </ul>
          </div>

          {/* Sosial Media - Kolom terpisah */}
          <div>
            <h4 className="text-sm font-black text-[#4b2417]">Sosial Media</h4>
            <div className="mt-3 space-y-3">
              {/* Instagram */}
              <a
                href="https://instagram.com/toti.cakery"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition hover:opacity-80"
              >
                <img src="src/assets/instagram.png" alt="Instagram" className="h-7 w-7" />
                <span className="text-xs text-[#6f5448] hover:text-[#d85b30]">
                  @toti.cakery
                </span>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition hover:opacity-80"
              >
                <img src="src/assets/whatsapp.png" alt="WhatsApp" className="h-7 w-7" />
                <span className="text-xs text-[#6f5448] hover:text-[#d85b30]">
                  +62 812-3456-7890
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-[#ead8ca] pt-5 text-center text-xs text-[#8b7166]">
          COPYRIGHT ©2026 TOTI CAKERY <br className="sm:hidden" /> ALL RIGHTS RESERVED
        </div>
      </div>
    </footer>
  )
}