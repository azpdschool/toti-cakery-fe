import { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { WhatsAppButton } from '@/components/common/WhatsAppButton'
import { BuyerNavbar } from '@/components/layout/BuyerNavbar'
import { BuyerFooter } from '@/components/layout/BuyerFooter'
import { BuyerBottomNav } from '@/components/layout/BuyerBottomNav'
import { BuyerBouncingLoader } from '@/components/common/TotiLoader'

export function BuyerLayout() {
  const location = useLocation()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const meshRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) return

    let rafId: number | null = null

    const handleScroll = () => {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        const el = meshRef.current
        if (!el) return
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        const p = Math.min(1, Math.max(0, window.scrollY / maxScroll))
        const gx = 6 + p * 88
        const gy = 16 + p * 64
        el.style.setProperty('--gx', `${gx.toFixed(2)}%`)
        el.style.setProperty('--gy', `${gy.toFixed(2)}%`)
      })
    }

    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [prefersReducedMotion, location.pathname])

  return (
    <div className="relative isolate flex min-h-screen flex-col pb-20 md:pb-0 w-full max-w-full overflow-x-clip">
      {/* Scroll-Linked CSS Mesh Backdrop */}
      <div
        ref={meshRef}
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none select-none toti-home-mesh"
      />

      <BuyerNavbar />

      <main className="relative z-10 flex-1 w-full max-w-full min-w-0">
        <Suspense fallback={<BuyerBouncingLoader mode="section" size="md" />}>
          <Outlet />
        </Suspense>
      </main>

      <BuyerFooter />

      <WhatsAppButton />
      <BuyerBottomNav />
    </div>
  )
}