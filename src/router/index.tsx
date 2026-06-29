// src/router/index.tsx

import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { SellerLayout } from '@/components/layout/SellerLayout';

// Buyer pages
import HomePage from '@/pages/buyer/HomePage';
import CatalogPage from '@/pages/buyer/CatalogPage';
import ProductDetailPage from '@/pages/buyer/ProductDetailPage';
import CartPage from '@/pages/buyer/CartPage';
import CheckoutPage from '@/pages/buyer/CheckoutPage';
import OrdersPage from '@/pages/buyer/OrdersPage';
import OrderDetailPage from '@/pages/buyer/OrderDetailPage';
import ProfilePage from '@/pages/buyer/ProfilePage';

// Auth pages
import BuyerLoginPage from '@/pages/auth/BuyerLoginPage';
import SellerLoginPage from '@/pages/auth/SellerLoginPage';
import SellerForgotPasswordPage from '@/pages/auth/SellerForgotPasswordPage';
import BuyerForgotPasswordPage from '@/pages/auth/BuyerForgotPasswordPage';

// Seller pages
import SellerDashboardPage from '@/pages/seller/SellerDashboardPage';
import SellerProductsPage from '@/pages/seller/SellerProductsPage';
import SellerInventoryPage from '@/pages/seller/SellerInventoryPage';
import SellerOrdersPage from '@/pages/seller/SellerOrdersPage';
import SellerReportsPage from '@/pages/seller/SellerFinancePage';
import SellerChatbotPage from '@/pages/seller/SellerChatbotPage';
import SellerSettingsPage from '@/pages/seller/SellerSettingsPage';

// NotFound
import NotFoundPage from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <BuyerLayout />,
    children: [
      { path: ROUTES.HOME, element: <HomePage /> },
      { path: ROUTES.CATALOG, element: <CatalogPage /> },
      { path: ROUTES.PRODUCT_DETAIL, element: <ProductDetailPage /> },
      { path: ROUTES.CART, element: <CartPage /> },
      { path: ROUTES.CHECKOUT, element: <CheckoutPage /> },
      { path: ROUTES.ORDERS, element: <OrdersPage /> },
      { path: ROUTES.ORDER_DETAIL, element: <OrderDetailPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
  { path: ROUTES.AUTH_BUYER, element: <BuyerLoginPage /> },
  { path: ROUTES.AUTH_SELLER, element: <SellerLoginPage /> },
  { path: '/auth/seller/forgot-password', element: <SellerForgotPasswordPage /> },
  { path: '/auth/buyer/forgot-password', element: <BuyerForgotPasswordPage /> },
  {
    element: <SellerLayout />,
    children: [
      { path: ROUTES.SELLER_DASHBOARD, element: <SellerDashboardPage /> },
      { path: ROUTES.SELLER_PRODUCTS, element: <SellerProductsPage /> },
      { path: ROUTES.SELLER_INVENTORY, element: <SellerInventoryPage /> },
      { path: ROUTES.SELLER_ORDERS, element: <SellerOrdersPage /> },
      { path: ROUTES.SELLER_REPORTS, element: <SellerReportsPage /> },
      { path: '/seller/chatbot', element: <SellerChatbotPage /> },
      { path: '/seller/settings', element: <SellerSettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);