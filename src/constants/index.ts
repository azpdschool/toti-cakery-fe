// src/constants/index.ts

export const API_BASE_URL = '/api'

export const WHATSAPP_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER ?? '6281234567890'

export const WHATSAPP_MESSAGE =
  'Halo Toti Cakery! Saya ingin bertanya tentang...'

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE,
)}`

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

  // Auth
  AUTH_BUYER: '/auth/buyer',
  AUTH_SELLER: '/auth/seller',
  AUTH_SELLER_FORGOT_PASSWORD: '/auth/seller/forgot-password',

  // Seller
  SELLER_DASHBOARD: '/seller/dashboard',
  SELLER_PRODUCTS: '/seller/products',
  SELLER_INVENTORY: '/seller/inventory',
  SELLER_ORDERS: '/seller/orders',
  SELLER_REPORTS: '/seller/reports',
  SELLER_CHATBOT: '/seller/chatbot',
  SELLER_SETTINGS: '/seller/settings',
} as const
