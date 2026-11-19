import { useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export interface PhotoLightboxModalProps {
  isOpen: boolean
  images: string[]
  currentIndex: number
  altPrefix?: string
  onClose: () => void
  onIndexChange: (index: number) => void
}

export function PhotoLightboxModal({
  isOpen,
  images,
  currentIndex,
  altPrefix = 'Photo',
  onClose,
  onIndexChange,
}: PhotoLightboxModalProps) {
  const total = images.length
  const currentImage = images[currentIndex] || images[0]

  const handlePrev = useCallback(() => {
    if (total <= 1) return
    onIndexChange((currentIndex - 1 + total) % total)
  }, [currentIndex, total, onIndexChange])

  const handleNext = useCallback(() => {
    if (total <= 1) return
    onIndexChange((currentIndex + 1) % total)
  }, [currentIndex, total, onIndexChange])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        e.stopPropagation()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.stopPropagation()
        handleNext()
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, handlePrev, handleNext])

  if (!isOpen || !currentImage) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <div
        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 sm:-top-12 sm:right-0 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer z-10"
          aria-label="Tutup foto"
        >
          <X className="h-7 w-7" />
        </button>

        {/* Main Image */}
        <div className="relative flex items-center justify-center w-full max-h-[80vh]">
          <img
            src={currentImage}
            alt={`${altPrefix} ${currentIndex + 1}`}
            className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl select-none"
            draggable={false}
          />

          {/* Navigation Arrows */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 sm:-left-6 top-1/2 -translate-y-1/2 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/60 sm:bg-white/90 text-white sm:text-[#3A1F16] shadow-lg backdrop-blur-sm transition hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:focus-visible:ring-[#9B4A2F] cursor-pointer z-10"
                aria-label="Foto sebelumnya"
                title="Foto sebelumnya"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 sm:-right-6 top-1/2 -translate-y-1/2 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/60 sm:bg-white/90 text-white sm:text-[#3A1F16] shadow-lg backdrop-blur-sm transition hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:focus-visible:ring-[#9B4A2F] cursor-pointer z-10"
                aria-label="Foto selanjutnya"
                title="Foto selanjutnya"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {/* Counter Badge */}
        {total > 1 && (
          <div className="mt-4 inline-flex items-center rounded-full bg-black/60 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md shadow">
            {currentIndex + 1} / {total}
          </div>
        )}
      </div>
    </div>
  )
}
