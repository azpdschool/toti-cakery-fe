import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalCardScrollerProps {
  children: React.ReactNode;
  className?: string;
  scrollContainerClassName?: string;
  scrollAmountRatio?: number;
  showEdgeFade?: boolean;
}

export function HorizontalCardScroller({
  children,
  className = '',
  scrollContainerClassName = '',
  scrollAmountRatio = 0.75,
  showEdgeFade = true,
}: HorizontalCardScrollerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    const observer = new ResizeObserver(() => {
      checkScroll();
    });
    observer.observe(el);

    // Also observe first child or children if available
    Array.from(el.children).forEach((child) => {
      observer.observe(child);
    });

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, [checkScroll, children]);

  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const delta = (el.clientWidth * scrollAmountRatio) || 280;
    el.scrollBy({
      left: direction === 'left' ? -delta : delta,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`group relative w-full ${className}`}>
      {/* Left Chevron Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="absolute left-1 sm:-left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/95 sm:bg-white text-gray-700 shadow-md border border-gray-200 transition-all hover:bg-gray-50 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}

      {/* Left Edge Fade */}
      {showEdgeFade && canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-r from-white/90 to-transparent z-10 rounded-l-xl" />
      )}

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className={`flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-2 pt-1 ${scrollContainerClassName}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Right Edge Fade */}
      {showEdgeFade && canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-l from-white/90 to-transparent z-10 rounded-r-xl" />
      )}

      {/* Right Chevron Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="absolute right-1 sm:-right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/95 sm:bg-white text-gray-700 shadow-md border border-gray-200 transition-all hover:bg-gray-50 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}
    </div>
  );
}
