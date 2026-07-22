// src/router/index.tsx
import { lazy } from 'react'
import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom'
import { ROUTES } from '@/constants'

// Layouts
const BuyerLayout = lazy(() =>
  import('@/components/layout/BuyerLayout').then((module) => ({
    default: module.BuyerLayout,
  })),
)

const SellerLayout = lazy(() =>
  import('@/components/layout/SellerLayout').then((module) => ({
    default: module.SellerLayout,
  })),
)

// Buyer pages
const HomePage = lazy(() => import('@/pages/buyer/HomePage'))
const CatalogPage = lazy(() => import('@/pages/buyer/CatalogPage'))
const ProductDetailPage = lazy(() => import('@/pages/buyer/ProductDetailPage'))
const CartPage = lazy(() => import('@/pages/buyer/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/buyer/CheckoutPage'))
const OrdersPage = lazy(() => import('@/pages/buyer/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/buyer/OrderDetailPage'))
const ProfilePage = lazy(() => import('@/pages/buyer/ProfilePage'))

// Auth pages
const BuyerLoginPage = lazy(() => import('@/pages/auth/BuyerLoginPage'))
const SellerLoginPage = lazy(() => import('@/pages/auth/SellerLoginPage'))
const SellerForgotPasswordPage = lazy(
  () => import('@/pages/auth/SellerForgotPasswordPage'),
)
const BuyerForgotPasswordPage = lazy(
  () => import('@/pages/auth/BuyerForgotPasswordPage'),
)

// Seller pages
const SellerDashboardPage = lazy(
  () => import('@/pages/seller/SellerDashboardPage'),
)
const SellerProductsPage = lazy(
  () => import('@/pages/seller/SellerProductsPage'),
)
const SellerInventoryPage = lazy(
  () => import('@/pages/seller/SellerInventoryPage'),
)
const SellerOrdersPage = lazy(() => import('@/pages/seller/SellerOrdersPage'))
const SellerReportsPage = lazy(() => import('@/pages/seller/SellerFinancePage'))
const SellerChatbotPage = lazy(() => import('@/pages/seller/SellerChatbotPage'))
const SellerSettingsPage = lazy(
  () => import('@/pages/seller/SellerSettingsPage'),
)

// NotFound
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function RouterErrorPage() {
  const error = useRouteError()

  console.error('Router error:', error)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-4">
      <div className="max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-red-600">
          Halaman gagal dimuat
        </h1>

        <p className="mt-3 text-sm text-[#6f5448]">
          Terjadi error saat membuka halaman ini. Cek Console atau terminal
          frontend untuk detail error.
        </p>

        <a
          href="/"
          className="mt-6 inline-flex rounded-xl bg-[#d85b30] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#c04e28]"
        >
          Kembali ke Beranda
        </a>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <BuyerLayout />,
    errorElement: <RouterErrorPage />,
    children: [
      {
        path: ROUTES.HOME,
        element: <HomePage />,
      },
      {
        path: ROUTES.CATALOG,
        element: <CatalogPage />,
      },
      {
        path: ROUTES.PRODUCT_DETAIL,
        element: <ProductDetailPage />,
      },
      {
        path: ROUTES.CART,
        element: <CartPage />,
      },
      {
        path: ROUTES.CHECKOUT,
        element: <CheckoutPage />,
      },
      {
        path: ROUTES.ORDERS,
        element: <OrdersPage />,
      },
      {
        path: ROUTES.ORDER_DETAIL,
        element: <OrderDetailPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
    ],
  },

  {
    path: ROUTES.AUTH_BUYER,
    element: <BuyerLoginPage />,
    errorElement: <RouterErrorPage />,
  },
  {
    path: '/auth/buyer/forgot-password',
    element: <BuyerForgotPasswordPage />,
    errorElement: <RouterErrorPage />,
  },

  {
    path: ROUTES.AUTH_SELLER,
    element: <SellerLoginPage />,
    errorElement: <RouterErrorPage />,
  },
  {
    path: ROUTES.AUTH_SELLER_FORGOT_PASSWORD,
    element: <SellerForgotPasswordPage />,
    errorElement: <RouterErrorPage />,
  },

  {
    element: <SellerLayout />,
    errorElement: <RouterErrorPage />,
    children: [
      {
        path: '/seller',
        element: <Navigate to={ROUTES.SELLER_DASHBOARD} replace />,
      },
      {
        path: ROUTES.SELLER_DASHBOARD,
        element: <SellerDashboardPage />,
      },
      {
        path: ROUTES.SELLER_PRODUCTS,
        element: <SellerProductsPage />,
      },
      {
        path: ROUTES.SELLER_INVENTORY,
        element: <SellerInventoryPage />,
      },
      {
        path: ROUTES.SELLER_ORDERS,
        element: <SellerOrdersPage />,
      },
      {
        path: ROUTES.SELLER_REPORTS,
        element: <SellerReportsPage />,
      },
      {
        path: ROUTES.SELLER_CHATBOT,
        element: <SellerChatbotPage />,
      },
      {
        path: ROUTES.SELLER_SETTINGS,
        element: <SellerSettingsPage />,
      },
    ],
  },

  {
    path: '*',
    element: <NotFoundPage />,
    errorElement: <RouterErrorPage />,
  },
])
