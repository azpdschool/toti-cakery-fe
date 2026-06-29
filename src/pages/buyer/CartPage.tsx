import { Link } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { formatRupiah } from '@/services/productService'
import { ROUTES } from '@/constants'
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react'

export default function CartPage() {
  // Hapus totalItems karena tidak dipakai di halaman ini
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-xl font-semibold text-gray-700">Keranjang Kosong</h2>
        <p className="mt-2 text-gray-500">Yuk, mulai belanja kue favoritmu!</p>
        <Link
          to={ROUTES.CATALOG}
          className="mt-6 inline-block rounded-lg bg-amber-600 px-6 py-2 text-white hover:bg-amber-700"
        >
          Lihat Produk
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800">Keranjang Belanja</h1>

      <div className="mt-6 divide-y divide-gray-200">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <img src={item.image} alt={item.name} className="h-16 w-16 rounded object-cover" />
              <div>
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.variantName}</p>
                <p className="text-sm font-medium text-amber-700">{formatRupiah(item.price)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.variantId, item.quantity - item.step)
                  }
                  className="rounded border px-2 py-1 text-gray-600 hover:bg-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.variantId, item.quantity + item.step)
                  }
                  className="rounded border px-2 py-1 text-gray-600 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {formatRupiah(item.price * item.quantity)}
              </span>
              <button
                onClick={() => removeItem(item.productId, item.variantId)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-amber-700">{formatRupiah(totalPrice)}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={clearCart}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Kosongkan Keranjang
          </button>
          <Link
            to={ROUTES.CHECKOUT}
            className="rounded bg-amber-600 px-6 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Lanjut ke Checkout
          </Link>
        </div>
      </div>
    </div>
  )
}