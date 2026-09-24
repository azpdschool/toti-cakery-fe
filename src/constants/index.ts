// src/constants/index.ts

export const API_BASE_URL = '/api'
export const LOGO_URL = 'https://res.cloudinary.com/mrje22up/image/upload/v1789575238/logo-toti.png'

export const TOKEN_KEY = 'toti_access_token'
export const USER_KEY = 'toti_user'
export const LANG_KEY = 'toti_lang'

export const ROUTES = {
  // Buyer
  HOME: '/',
  CATALOG: '/catalog',
  PRODUCT_DETAIL: '/catalog/:slug',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  WISHLIST: '/profile/wishlist',

  // Auth
  AUTH_BUYER: '/auth/buyer/login',
  AUTH_BUYER_REGISTER: '/auth/buyer/register',
  AUTH_BUYER_FORGOT_PASSWORD: '/auth/buyer/forgot-password',
  AUTH_SELLER: '/auth/login',
  AUTH_SELLER_FORGOT_PASSWORD: '/auth/seller/forgot-password',

  // Seller
  SELLER_DASHBOARD: '/seller/dashboard',
  SELLER_PRODUCTS: '/seller/products',
  SELLER_INVENTORY: '/seller/inventory',
  SELLER_ORDERS: '/seller/orders',
  SELLER_REPORTS: '/seller/reports',
  SELLER_FAQ: '/seller/faq',
  SELLER_SETTINGS: '/seller/settings',
  BUYER_FAQ: '/faq',
} as const
