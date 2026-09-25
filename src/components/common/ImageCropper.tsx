import React, { useState, useRef, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ImageCropperProps {
  imageSrc: string
  onCrop: (croppedFile: File) => void
  onCancel: () => void
  isUploading?: boolean
}

export default function ImageCropper({
  imageSrc,
  onCrop,
  onCancel,
  isUploading = false,
}: ImageCropperProps) {
  const { t } = useTranslation()
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isUploading) return
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    setDragStart({ x: clientX - position.x, y: clientY - position.y })
  }

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || isUploading) return
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
    setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleMouseMove, { passive: false })
      window.addEventListener('touchend', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, dragStart])

  const handleResetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleConfirm = () => {
    if (!imgRef.current || !containerRef.current || isUploading) return
    const canvas = document.createElement('canvas')
    const size = 400 // output size
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = imgRef.current
    const containerSize = containerRef.current.offsetWidth
    const ratio = size / containerSize

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    const drawWidth = img.naturalWidth * scale * ratio
    const drawHeight = img.naturalHeight * scale * ratio
    const drawX = size / 2 + position.x * ratio - drawWidth / 2
    const drawY = size / 2 + position.y * ratio - drawHeight / 2

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
          onCrop(file)
        }
      },
      'image/jpeg',
      0.9
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#4b2417]">
            {t('profile.change_avatar_title', 'Ganti Foto Profil')}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label={t('profile.cancel', 'Batal')}
            title={t('profile.cancel', 'Batal')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Circular Avatar Crop Container */}
        <div
          ref={containerRef}
          className="relative mx-auto h-64 w-64 overflow-hidden rounded-full border-4 border-[#d85b30]/30 bg-gray-100 shadow-inner cursor-move select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt={t('profile.crop_preview', 'Crop preview')}
            draggable={false}
            className="absolute left-1/2 top-1/2 max-w-none origin-center pointer-events-none"
            style={{
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
            }}
          />
        </div>

        {/* Controls: Zoom Out, Range Slider, Zoom In, Reset */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.5, Math.round((s - 0.1) * 10) / 10))}
            disabled={isUploading || scale <= 0.5}
            className="rounded-full p-2 text-[#4b2417] transition hover:bg-[#fff4ed] disabled:opacity-40"
            title={t('profile.zoom_out', 'Perkecil')}
            aria-label={t('profile.zoom_out', 'Perkecil')}
          >
            <ZoomOut className="h-5 w-5" />
          </button>

          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={scale}
            disabled={isUploading}
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1 accent-[#d85b30]"
            aria-label={t('profile.zoom_level', 'Tingkat zoom')}
          />

          <button
            type="button"
            onClick={() => setScale((s) => Math.min(3, Math.round((s + 0.1) * 10) / 10))}
            disabled={isUploading || scale >= 3}
            className="rounded-full p-2 text-[#4b2417] transition hover:bg-[#fff4ed] disabled:opacity-40"
            title={t('profile.zoom_in', 'Perbesar')}
            aria-label={t('profile.zoom_in', 'Perbesar')}
          >
            <ZoomIn className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            disabled={isUploading}
            className="rounded-full p-2 text-[#4b2417] transition hover:bg-[#fff4ed] disabled:opacity-40"
            title={t('profile.reset_zoom', 'Atur ulang zoom')}
            aria-label={t('profile.reset_zoom', 'Atur ulang zoom')}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="rounded-xl border border-[#d0bfaf] px-4 py-2 text-sm font-bold text-[#4b2417] transition hover:bg-[#fff4ed] disabled:opacity-50"
          >
            {t('profile.cancel', 'Batal')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#c04e28] disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('profile.uploading', 'Mengunggah...')}</span>
              </>
            ) : (
              <span>{t('profile.use_photo', 'Gunakan Foto')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
