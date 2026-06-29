import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProductBySlug, formatRupiah } from '@/services/productService'
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '@/constants'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/services/productService'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  const { addItem } = useCart()

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getProductBySlug(slug)
      .then((data) => {
        if (!data) setError('Produk tidak ditemukan')
        else {
          setProduct(data)
          setQuantity(data.variants[0]?.minOrder || 1)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  const handleAddToCart = () => {
    if (!product) return
    const variant = product.variants[0]
    addItem({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantName: variant.name,
      price: variant.price,
      image: product.image,
      minOrder: variant.minOrder,
      step: variant.step,
      quantity,
    })
    alert(`${quantity}x ${product.name} (${variant.name}) ditambahkan ke keranjang!`)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-500">{error || 'Produk tidak ditemukan'}</p>
        <Link to="/catalog" className="mt-4 inline-block text-amber-600 underline">
          Kembali ke katalog
        </Link>
      </div>
    )
  }

  const variant = product.variants[0]

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:grid md:grid-cols-2 md:gap-8">
      <div>
        <img
          src={product.image}
          alt={product.name}
          className="h-auto w-full rounded-lg shadow"
        />
      </div>

      <div className="mt-4 space-y-4 md:mt-0">
        <h1 className="text-2xl font-bold md:text-3xl">{product.name}</h1>
        <p className="capitalize text-gray-500">
          Kategori: <span className="font-medium text-gray-700">{product.category}</span>
        </p>
        <p className="text-3xl font-semibold text-amber-700">
          {formatRupiah(variant.price)}
        </p>
        {product.description && <p className="text-gray-600">{product.description}</p>}

        <div className="flex items-center gap-2">
          <span className="text-lg text-yellow-600">
            {'★'.repeat(Math.round(product.rating))}
            {'☆'.repeat(5 - Math.round(product.rating))}
          </span>
          <span className="text-sm text-gray-500">
            {product.rating} ({product.soldCount} terjual)
          </span>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={() => setQuantity((q) => Math.max(variant.minOrder, q - variant.step))}
            className="rounded border px-3 py-1"
          >
            -
          </button>
          <span className="text-lg">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + variant.step)}
            className="rounded border px-3 py-1"
          >
            +
          </button>
          <span className="text-xs text-gray-500">
            Min. {variant.minOrder} (kelipatan {variant.step})
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full rounded-lg bg-amber-600 px-6 py-3 text-white transition hover:bg-amber-700 md:w-auto"
        >
          Tambahkan ke Keranjang
        </button>

        <div className="mt-6 rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366" className="h-5 w-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Mau custom?</p>
              <p className="text-sm text-gray-600">
                Chat WhatsApp kami di{' '}
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#25D366] hover:underline">
                  {WHATSAPP_NUMBER}
                </a>
              </p>
            </div>
          </div>
        </div>

        <Link to="/catalog" className="mt-4 block text-amber-600 underline hover:text-amber-800">
          ← Kembali ke katalog
        </Link>
      </div>
    </div>
  )
}