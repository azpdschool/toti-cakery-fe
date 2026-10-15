import { useState, useEffect, useCallback } from 'react'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Loader2,
  Crop as CropIcon,
  Maximize2,
  CheckCircle2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Cropper, { type Area, type Point } from 'react-easy-crop'

export interface ImageCropperProps {
  imageSrc: string
  onCrop: (croppedFile: File) => void
  onCancel: () => void
  isUploading?: boolean
  title?: string
  cropShape?: 'rect' | 'round'
  aspectRatio?: number
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

function calculateRotatedBox(width: number, height: number, rotation: number) {
  const rad = getRadianAngle(rotation)
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  }
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<File | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  const rotRad = getRadianAngle(rotation)
  const { width: bBoxWidth, height: bBoxHeight } = calculateRotatedBox(
    image.naturalWidth,
    image.naturalHeight,
    rotation
  )

  canvas.width = Math.round(bBoxWidth)
  canvas.height = Math.round(bBoxHeight)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rotRad)
  ctx.translate(-image.naturalWidth / 2, -image.naturalHeight / 2)
  ctx.drawImage(image, 0, 0)

  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')
  if (!croppedCtx) return null

  const targetWidth = Math.max(1, Math.round(pixelCrop.width))
  const targetHeight = Math.max(1, Math.round(pixelCrop.height))

  croppedCanvas.width = targetWidth
  croppedCanvas.height = targetHeight

  croppedCtx.fillStyle = '#ffffff'
  croppedCtx.fillRect(0, 0, targetWidth, targetHeight)

  croppedCtx.drawImage(canvas, -pixelCrop.x, -pixelCrop.y)

  return new Promise((resolve) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(new File([blob], 'cropped_image.jpg', { type: 'image/jpeg' }))
        } else {
          resolve(null)
        }
      },
      'image/jpeg',
      0.92
    )
  })
}

async function getOriginalFile(src: string): Promise<File> {
  try {
    const res = await fetch(src)
    const blob = await res.blob()
    const type = blob.type || 'image/jpeg'
    const ext = type.includes('png') ? 'png' : 'jpg'
    return new File([blob], `original_image.${ext}`, { type })
  } catch {
    const image = await createImage(src)
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context unavailable')
    ctx.drawImage(image, 0, 0)
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], 'original_image.jpg', { type: 'image/jpeg' }))
          } else {
            reject(new Error('Failed to generate image blob'))
          }
        },
        'image/jpeg',
        0.95
      )
    })
  }
}

export default function ImageCropper({
  imageSrc,
  onCrop,
  onCancel,
  isUploading = false,
  title,
  cropShape = 'round',
  aspectRatio = 1,
}: ImageCropperProps) {
  const { t } = useTranslation()

  // Mode: 'crop' | 'original'
  const [mode, setMode] = useState<'crop' | 'original'>('crop')

  // Cropper states
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Aspect ratio state (for product / rect images)
  const [naturalAspect, setNaturalAspect] = useState<number>(aspectRatio || 1)
  const [selectedRatioKey, setSelectedRatioKey] = useState<'1:1' | '4:3' | 'original'>(
    aspectRatio === 1 ? '1:1' : aspectRatio === 4 / 3 ? '4:3' : 'original'
  )

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setNaturalAspect(img.naturalWidth / img.naturalHeight)
      }
    }
  }, [imageSrc])

  const currentAspect =
    cropShape === 'round'
      ? 1
      : selectedRatioKey === '1:1'
      ? 1
      : selectedRatioKey === '4:3'
      ? 4 / 3
      : naturalAspect

  const onCropComplete = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels)
  }, [])

  const handleReset = () => {
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    setRotation(0)
    setSelectedRatioKey(aspectRatio === 1 ? '1:1' : aspectRatio === 4 / 3 ? '4:3' : 'original')
  }

  const handleConfirm = async () => {
    if (isUploading || isProcessing) return
    setIsProcessing(true)
    try {
      if (mode === 'original') {
        const file = await getOriginalFile(imageSrc)
        onCrop(file)
      } else {
        if (!croppedAreaPixels) return
        const file = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
        if (file) {
          onCrop(file)
        }
      }
    } catch (err) {
      console.error('Failed to crop image:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const dialogTitle =
    title ||
    (cropShape === 'rect'
      ? t('products.upload_image_title', 'Unggah Foto Produk')
      : t('profile.change_avatar_title', 'Ubah Foto Profil'))

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-lg font-bold text-[#4b2417] truncate">{dialogTitle}</h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading || isProcessing}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition"
            aria-label={t('profile.cancel', 'Batal')}
            title={t('profile.cancel', 'Batal')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tabs: Use Original vs Crop & Adjust */}
        <div className="mb-4 flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode('original')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all ${
              mode === 'original'
                ? 'bg-white text-[#d85b30] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Maximize2 className="h-4 w-4" />
            <span>{t('profile.mode_original', 'Gunakan Ukuran Asli')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('crop')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all ${
              mode === 'crop'
                ? 'bg-white text-[#d85b30] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CropIcon className="h-4 w-4" />
            <span>{t('profile.mode_crop', 'Potong & Sesuaikan')}</span>
          </button>
        </div>

        {/* Canvas / Preview Container */}
        {mode === 'original' ? (
          <div>
            <div className="relative flex h-72 sm:h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-gray-800 bg-gray-950 p-3 shadow-inner">
              <img
                src={imageSrc}
                alt={t('profile.preview_original', 'Ukuran Asli')}
                className="max-h-full max-w-full select-none rounded object-contain"
              />
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                {t(
                  'profile.original_notice',
                  'Foto akan digunakan secara penuh (100% utuh) tanpa ada bagian yang terpotong.'
                )}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div className="relative h-72 sm:h-80 w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-950 shadow-inner">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={currentAspect}
                minZoom={0.5}
                maxZoom={3}
                cropShape={cropShape}
                restrictPosition={false}
                showGrid={cropShape === 'rect'}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                classes={{
                  containerClassName: 'rounded-xl',
                  cropAreaClassName:
                    cropShape === 'rect'
                      ? '!rounded-xl border-2 border-white/80 shadow-2xl'
                      : '!rounded-full border-2 border-white/80 shadow-2xl',
                }}
              />
            </div>

            {/* Aspect Ratio Options for Rectangular Crop (e.g. Products) */}
            {cropShape === 'rect' && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('profile.aspect_ratio', 'Rasio')}:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRatioKey('1:1')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      selectedRatioKey === '1:1'
                        ? 'bg-[#d85b30] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('profile.ratio_square', '1:1 Square')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRatioKey('4:3')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      selectedRatioKey === '4:3'
                        ? 'bg-[#d85b30] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('profile.ratio_standard', '4:3')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRatioKey('original')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      selectedRatioKey === 'original'
                        ? 'bg-[#d85b30] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('profile.ratio_original', 'Free / Original')}
                  </button>
                </div>
              </div>
            )}

            {/* Toolbar Controls: Zoom & Rotate & Reset */}
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2.5">
              <div className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
                  disabled={isUploading || isProcessing || zoom <= 0.5}
                  className="rounded-lg p-1.5 text-gray-600 transition hover:bg-white hover:shadow-sm disabled:opacity-40"
                  title={t('profile.zoom_out', 'Perkecil')}
                  aria-label={t('profile.zoom_out', 'Perkecil')}
                >
                  <ZoomOut className="h-4 w-4" />
                </button>

                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={zoom}
                  disabled={isUploading || isProcessing}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer accent-[#d85b30]"
                  aria-label={t('profile.zoom_level', 'Tingkat zoom')}
                />

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.1) * 10) / 10))}
                  disabled={isUploading || isProcessing || zoom >= 3}
                  className="rounded-lg p-1.5 text-gray-600 transition hover:bg-white hover:shadow-sm disabled:opacity-40"
                  title={t('profile.zoom_in', 'Perbesar')}
                  aria-label={t('profile.zoom_in', 'Perbesar')}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>

                <span className="w-10 font-mono text-xs font-medium text-gray-500 text-right">
                  {zoom.toFixed(1)}x
                </span>
              </div>

              <div className="mx-1 h-4 w-px bg-gray-300" />

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  disabled={isUploading || isProcessing}
                  className="flex items-center gap-1 rounded-lg p-1.5 text-xs font-medium text-[#4b2417] transition hover:bg-white hover:shadow-sm disabled:opacity-40"
                  title={t('profile.rotate', 'Putar 90°')}
                  aria-label={t('profile.rotate', 'Putar 90°')}
                >
                  <RotateCw className="h-4 w-4" />
                  <span className="hidden sm:inline">90°</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isUploading || isProcessing}
                  className="rounded-lg p-1.5 text-[#4b2417] transition hover:bg-white hover:shadow-sm disabled:opacity-40"
                  title={t('profile.reset', 'Atur Ulang')}
                  aria-label={t('profile.reset', 'Atur Ulang')}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading || isProcessing}
            className="rounded-xl border border-[#d0bfaf] px-4 py-2 text-sm font-bold text-[#4b2417] transition hover:bg-[#fff4ed] disabled:opacity-50"
          >
            {t('profile.cancel', 'Batal')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isUploading || isProcessing}
            className="inline-flex items-center gap-2 rounded-xl bg-[#d85b30] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#c04e28] disabled:opacity-50"
          >
            {isUploading || isProcessing ? (
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
