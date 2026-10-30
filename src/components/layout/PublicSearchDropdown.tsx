// src/components/layout/PublicSearchDropdown.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import {
  Search,
  X,
  Package,
  HelpCircle,
  MessageCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'

import {
  publicSearch,
  type PublicSearchResponse,
  type PublicProductSearchResult,
  type PublicFaqSearchResult,
  type PublicStoreInfoSearchResult,
} from '@/api/publicSearch'
import { useWhatsApp } from '@/context/WhatsAppContext'
import { formatRupiah, placeholderImage } from '@/services/productService'
import { API_BASE_URL, ROUTES } from '@/constants'

interface PublicSearchDropdownProps {
  /** Optional callback fired when an item is clicked (e.g. to close mobile menu) */
  onItemClick?: () => void
  /** Class name overrides for the outer container */
  className?: string
  /** Placeholder override or defaults to i18n */
  placeholder?: string
  /** Auto-focus on mount */
  autoFocus?: boolean
}

function resolveProductImage(imageUrl: string | null): string {
  if (!imageUrl) return placeholderImage
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  if (imageUrl.startsWith('/')) return `${API_BASE_URL}${imageUrl}`
  return `${API_BASE_URL}/${imageUrl}`
}

export function PublicSearchDropdown({
  onItemClick,
  className = '',
  placeholder,
  autoFocus = false,
}: PublicSearchDropdownProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { getWhatsAppUrl, whatsappNumberDisplay } = useWhatsApp()

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<PublicSearchResponse | null>(null)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const trimmedQuery = query.trim()

  // ── Debounced Search Effect (300ms) ───────────────────────────
  useEffect(() => {
    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Reset error & rate limit on query change
    setIsRateLimited(false)
    setErrorMessage(null)

    // Client-side guard: do not fetch if trimmed query is less than 2 characters
    if (trimmedQuery.length < 2) {
      setIsLoading(false)
      setResults(null)
      return
    }

    // Client-side guard against control chars / tags that backend rejects with 422
    if (/[\x00-\x1f\x7f<>]/.test(query)) {
      setIsLoading(false)
      setResults(null)
      return
    }

    setIsLoading(true)

    const timer = setTimeout(async () => {
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const data = await publicSearch(trimmedQuery, controller.signal)
        setResults(data)
        setIsRateLimited(false)
        setErrorMessage(null)
      } catch (err: unknown) {
        if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
          // Request was intentionally aborted, ignore
          return
        }

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 429) {
            setIsRateLimited(true)
            setResults(null)
          } else if (err.response?.status === 422) {
            // Validation error from backend
            setResults(null)
          } else {
            setErrorMessage(t('common.error', 'Terjadi kesalahan'))
            setResults(null)
          }
        } else {
          setResults(null)
        }
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [trimmedQuery, query, t])

  // ── Click Outside to Close ────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Navigation Handlers ───────────────────────────────────────
  const handleClose = useCallback(() => {
    setIsOpen(false)
    onItemClick?.()
  }, [onItemClick])

  const handleSelectProduct = (product: PublicProductSearchResult) => {
    const slugOrId = product.slug || product.id
    navigate(`/catalog/${slugOrId}`)
    handleClose()
  }

  const handleSelectFaq = (faq: PublicFaqSearchResult) => {
    navigate(`/faq?id=${faq.id}`)
    handleClose()
  }

  const handleSelectStoreInfo = (storeInfo: PublicStoreInfoSearchResult) => {
    if (storeInfo.action === 'fetch_contact_endpoint') {
      const waUrl = getWhatsAppUrl()
      window.open(waUrl, '_blank', 'noopener,noreferrer')
    }
    handleClose()
  }

  const handleViewAllInCatalog = () => {
    if (trimmedQuery.length > 0) {
      navigate(`/catalog?q=${encodeURIComponent(trimmedQuery)}`)
    } else {
      navigate(ROUTES.CATALOG)
    }
    handleClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleViewAllInCatalog()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults(null)
    setIsRateLimited(false)
    setErrorMessage(null)
    inputRef.current?.focus()
  }

  const hasProducts = Boolean(results?.products && results.products.length > 0)
  const hasFaqs = Boolean(results?.faqs && results.faqs.length > 0)
  const hasStoreInfo = Boolean(results?.store_info && results.store_info.length > 0)
  const hasAnyResults = hasProducts || hasFaqs || hasStoreInfo

  const showDropdown = Boolean(
    isOpen &&
      (trimmedQuery.length > 0 || isRateLimited || isLoading || hasAnyResults)
  )

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B4A3C]" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('search.placeholder', 'Cari dessert favorit kamu...')}
          className="h-10 w-full rounded-full border border-[#D0BFAF] bg-white/90 pl-10 pr-9 text-xs font-medium text-[#3A1F16] outline-none placeholder:text-[#9C8478] focus:border-[#9B4A2F] focus:bg-white focus:ring-2 focus:ring-[#9B4A2F]/25"
          aria-label={t('search.placeholder', 'Cari dessert favorit kamu...')}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />

        {isLoading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B4A2F]">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#9C8478] hover:bg-[#EFE4D6] hover:text-[#3A1F16]"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Floating Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[75vh] overflow-y-auto rounded-2xl border border-[#D0BFAF] bg-white p-2 shadow-2xl animate-in fade-in-0 zoom-in-95">
          {/* Rate Limit Exceeded State */}
          {isRateLimited ? (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-[#7A4B1A]">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-xs">
                <p className="font-semibold text-amber-900">
                  {t('search.rate_limited', 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.')}
                </p>
                <p className="mt-1 text-amber-700">
                  Batas pencarian tercapai (maks. 30/menit). Mohon istirahat sejenak sebelum mencari lagi.
                </p>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="p-4 text-center text-xs text-red-600">
              {errorMessage}
            </div>
          ) : trimmedQuery.length === 1 ? (
            /* Min Length Hint */
            <div className="p-4 text-center text-xs text-[#9C8478]">
              {t('search.min_length_hint', 'Ketik minimal 2 karakter...')}
            </div>
          ) : isLoading && !results ? (
            /* Loading State */
            <div className="flex items-center justify-center gap-2 p-6 text-xs font-medium text-[#6B4A3C]">
              <Loader2 className="h-4 w-4 animate-spin text-[#9B4A2F]" />
              <span>{t('search.loading', 'Mencari...')}</span>
            </div>
          ) : !hasAnyResults ? (
            /* No Results Found */
            <div className="p-5 text-center">
              <p className="text-xs font-semibold text-[#3A1F16]">
                {t('search.no_results', {
                  query: trimmedQuery,
                  defaultValue: `Tidak ada hasil untuk "${trimmedQuery}"`,
                })}
              </p>
              <button
                type="button"
                onClick={handleViewAllInCatalog}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#F6EFE6] px-3.5 py-1.5 text-xs font-semibold text-[#9B4A2F] transition-colors hover:bg-[#EAD8CA]"
              >
                <span>{t('catalog.all_products', 'Lihat Semua Produk')}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            /* Result Sections */
            <div className="space-y-3">
              {/* 1. Products Section */}
              {hasProducts && (
                <div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9C8478]">
                    <Package className="h-3.5 w-3.5 text-[#9B4A2F]" />
                    <span>{t('search.section_products', 'Produk')}</span>
                  </div>

                  <div className="space-y-1">
                    {results?.products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[#F6EFE6] focus:bg-[#F6EFE6] focus:outline-none"
                      >
                        <img
                          src={resolveProductImage(product.image_url)}
                          alt={product.nama_produk}
                          className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-[#D0BFAF]/60"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-[#3A1F16]">
                            {product.nama_produk}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                            {product.kategori && (
                              <span className="rounded bg-[#EFE4D6] px-1.5 py-0.5 text-[10px] font-medium text-[#6B4A3C]">
                                {product.kategori}
                              </span>
                            )}
                            <span className="font-semibold text-[#9B4A2F]">
                              {formatRupiah(product.harga_jual)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#9C8478] opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. FAQs Section */}
              {hasFaqs && (
                <div className={hasProducts ? 'border-t border-[#EFE4D6] pt-2' : ''}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9C8478]">
                    <HelpCircle className="h-3.5 w-3.5 text-[#9B4A2F]" />
                    <span>{t('search.section_faqs', 'Pertanyaan Umum (FAQ)')}</span>
                  </div>

                  <div className="space-y-1">
                    {results?.faqs.map((faq) => (
                      <button
                        key={faq.id}
                        type="button"
                        onClick={() => handleSelectFaq(faq)}
                        className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-colors hover:bg-[#F6EFE6] focus:bg-[#F6EFE6] focus:outline-none"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#3A1F16]">
                            {faq.pertanyaan}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-[#6B4A3C]">
                            {faq.jawaban}
                          </p>
                        </div>
                        <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[#9C8478] opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Store Info Section */}
              {hasStoreInfo && (
                <div className={hasProducts || hasFaqs ? 'border-t border-[#EFE4D6] pt-2' : ''}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9C8478]">
                    <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                    <span>{t('search.section_store_info', 'Informasi Toko')}</span>
                  </div>

                  <div className="space-y-1">
                    {results?.store_info.map((info) => (
                      <button
                        key={info.key}
                        type="button"
                        onClick={() => handleSelectStoreInfo(info)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-3 text-left transition-colors hover:bg-[#25D366]/10 focus:outline-none"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1E3A24]">
                              {info.title}
                            </span>
                            {whatsappNumberDisplay && (
                              <span className="rounded-full bg-[#25D366]/20 px-2 py-0.5 text-[10px] font-semibold text-[#1E3A24]">
                                {whatsappNumberDisplay}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#2F5E38]">
                            {info.description}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#25D366]">
                          <span className="hidden sm:inline">
                            {t('search.open_whatsapp', 'Chat via WhatsApp')}
                          </span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer: View All In Catalog */}
              <div className="border-t border-[#EFE4D6] pt-2">
                <button
                  type="button"
                  onClick={handleViewAllInCatalog}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-[#9B4A2F] transition-colors hover:bg-[#F6EFE6]"
                >
                  <span>
                    {t('search.view_all_catalog', {
                      query: trimmedQuery,
                      defaultValue: `Lihat semua produk untuk "${trimmedQuery}"`,
                    })}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
