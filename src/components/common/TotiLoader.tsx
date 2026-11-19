import React from 'react'

export interface TotiLoaderProps {
  variant?: 'buyer' | 'seller'
  size?: 'sm' | 'md' | 'lg'
  mode?: 'inline' | 'section' | 'fullScreen'
  label?: React.ReactNode
  className?: string
}

export function BuyerBouncingLoader({
  size = 'md',
  mode = 'inline',
  label,
  className = '',
}: Omit<TotiLoaderProps, 'variant'>) {
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }
  const shadowSizes = {
    sm: 'w-2 h-0.5',
    md: 'w-3.5 h-1',
    lg: 'w-4 h-1.5',
  }

  const content = (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        {/* Ball 1: Brick */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`${dotSizes[size]} rounded-full bg-[#9B4A2F] toti-bounce-dot`}
            style={{
              animation: 'toti-bounce-ball 1.2s cubic-bezier(0.28, 0.84, 0.42, 1) infinite',
              animationDelay: '0s',
            }}
          />
          <div
            className={`${shadowSizes[size]} rounded-full bg-[#6B4A3C]/40 toti-bounce-shadow`}
            style={{
              animation: 'toti-bounce-shadow 1.2s cubic-bezier(0.28, 0.84, 0.42, 1) infinite',
              animationDelay: '0s',
            }}
          />
        </div>

        {/* Ball 2: Honey */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`${dotSizes[size]} rounded-full bg-[#E0A04E] toti-bounce-dot`}
            style={{
              animation: 'toti-bounce-ball 1.2s cubic-bezier(0.28, 0.84, 0.42, 1) infinite',
              animationDelay: '0.16s',
            }}
          />
          <div
            className={`${shadowSizes[size]} rounded-full bg-[#6B4A3C]/40 toti-bounce-shadow`}
            style={{
              animation: 'toti-bounce-shadow 1.2s cubic-bezier(0.28, 0.84, 0.42, 1) infinite',
              animationDelay: '0.16s',
            }}
          />
        </div>

        {/* Ball 3: Warm Cocoa */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`${dotSizes[size]} rounded-full bg-[#6B4A3C] toti-bounce-dot`}
            style={{
              animation: 'toti-bounce-ball 1.2s cubic-bezier(0.28, 0.84, 0.42, 1) infinite',
              animationDelay: '0.32s',
            }}
          />
          <div
            className={`${shadowSizes[size]} rounded-full bg-[#6B4A3C]/40 toti-bounce-shadow`}
            style={{
              animation: 'toti-bounce-shadow 1.2s cubic-bezier(0.28, 0.84, 0.42, 1) infinite',
              animationDelay: '0.32s',
            }}
          />
        </div>
      </div>

      <span className="sr-only">Loading...</span>
      {label && <p className="text-xs sm:text-sm font-bold text-[#6B4A3C] tracking-wide">{label}</p>}
    </div>
  )

  if (mode === 'fullScreen') {
    return (
      <div className="flex min-h-screen w-full flex-1 items-center justify-center bg-toti-cream p-4">
        {content}
      </div>
    )
  }

  if (mode === 'section') {
    return (
      <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center bg-transparent py-12">
        {content}
      </div>
    )
  }

  return content
}

export function SellerSquareMorphLoader({
  size = 'md',
  mode = 'inline',
  label,
  className = '',
}: Omit<TotiLoaderProps, 'variant'>) {
  const morphSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  }
  const shadowSizes = {
    sm: 'w-6 h-1 mt-1.5',
    md: 'w-10 h-1.5 mt-2',
    lg: 'w-14 h-2 mt-3',
  }

  const content = (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className="relative flex flex-col items-center">
        <div
          className={`${morphSizes[size]} shadow-sm toti-morph-square`}
          style={{ animation: 'toti-square-morph 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
        />
        <div
          className={`${shadowSizes[size]} rounded-full bg-black/20 toti-morph-shadow`}
          style={{ animation: 'toti-square-shadow 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
        />
      </div>

      <span className="sr-only">Loading...</span>
      {label && <p className="text-xs sm:text-sm font-semibold text-[#6B4A3C] tracking-wide">{label}</p>}
    </div>
  )

  if (mode === 'fullScreen') {
    return (
      <div className="flex min-h-screen w-full flex-1 items-center justify-center bg-gray-50 p-4">
        {content}
      </div>
    )
  }

  if (mode === 'section') {
    return (
      <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center bg-transparent py-12">
        {content}
      </div>
    )
  }

  return content
}

export function TotiLoader({ variant = 'buyer', ...props }: TotiLoaderProps) {
  return variant === 'seller' ? (
    <SellerSquareMorphLoader {...props} />
  ) : (
    <BuyerBouncingLoader {...props} />
  )
}
