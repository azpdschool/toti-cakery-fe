import React, { useEffect, useRef, useState } from 'react';

// ============================================================================
// 1. Accessibility Hook: prefers-reduced-motion
// ============================================================================

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

  return prefersReducedMotion;
}

// ============================================================================
// 2. ScrollProgressBar: Fixed 3px glowing bar flush beneath 77px navbar
// ============================================================================

export function ScrollProgressBar({ className = '' }: { className?: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    let rafId: number;

    const updateProgress = () => {
      if (!barRef.current) return;
      const docElem = document.documentElement;
      const totalScroll = docElem.scrollHeight - window.innerHeight;
      const progress = totalScroll > 0 ? Math.min(Math.max(window.scrollY / totalScroll, 0), 1) : 0;
      barRef.current.style.transform = `scaleX(${progress})`;
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className={`fixed top-[76px] inset-x-0 z-[39] h-[3px] pointer-events-none origin-left bg-gradient-to-r from-[#9B4A2F] via-[#E0A04E] to-[#9B4A2F] shadow-[0_0_10px_rgba(224,160,78,0.45)] transition-transform duration-75 ease-out ${className}`}
      style={{ transform: 'scaleX(0)' }}
    />
  );
}

// ============================================================================
// 3. ScrollReveal: Lightweight GPU-composited IntersectionObserver wrapper
// ============================================================================

export interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'scale';
  distance?: number;
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 24,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -32px 0px',
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getInitialTransform = () => {
    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}px, 0) scale(0.985)`;
      case 'left':
        return `translate3d(${distance}px, 0, 0) scale(0.985)`;
      case 'right':
        return `translate3d(-${distance}px, 0, 0) scale(0.985)`;
      case 'scale':
        return `translate3d(0, 0, 0) scale(0.95)`;
      default:
        return `translate3d(0, ${distance}px, 0) scale(0.985)`;
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : getInitialTransform(),
        transition: 'opacity 700ms cubic-bezier(0.16, 1, 0.3, 1), transform 700ms cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// 4. ScrollParallaxHero: Clean Wide Editorial Header
// ============================================================================

export interface ScrollParallaxHeroProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  badge?: string;
  className?: string;
}

export function ScrollParallaxHero({
  icon: Icon,
  title,
  subtitle,
  badge,
  className = '',
}: ScrollParallaxHeroProps) {
  return (
    <div
      className={`w-full max-w-7xl mx-auto pt-8 pb-6 px-4 sm:px-6 lg:px-8 text-left mb-8 sm:mb-10 ${className}`}
    >
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-xl bg-white border border-[#E8DCCB] p-2.5 shadow-xs text-[#9B4A2F]">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#9B4A2F]" />
          </div>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-[#9B4A2F]/10 px-3 py-1 text-xs font-bold text-[#9B4A2F]">
              {badge}
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#3A1F16] font-display tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#6f5448] leading-relaxed max-w-3xl font-sans">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export const WideEditorialHeader = ScrollParallaxHero;

// ============================================================================
// 5. ScrollTrackTimeline: Clean Wrapper (Zero Visual Clutter)
// ============================================================================

export function ScrollTrackTimeline({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// 6. useActiveSectionSpy: Lightweight Hook for Table of Contents
// ============================================================================

export function useActiveSectionSpy(
  sectionIds: string[],
  rootMargin = '-110px 0px -55% 0px'
): string {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] || '');

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    if (sectionIds.length === 0) return;

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((entry) => entry.isIntersecting);
        if (intersecting.length > 0) {
          intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (intersecting[0].target.id) {
            setActiveId(intersecting[0].target.id);
          }
        }
      },
      {
        rootMargin,
        threshold: [0, 0.2, 0.5, 0.8],
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [sectionIds, rootMargin]);

  return activeId;
}
