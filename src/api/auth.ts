import { apiClient } from './client'
import type { SellerRole, User } from '@/types'
import { formatPhoneNumber } from '@/utils/phone'

// ============================================================
// SELLER AUTH TYPES
// ============================================================

export interface SellerLoginCredentials {
  username: string
  password: string
}

export interface SellerLoginResponse {
  access_token: string
  token_type: string
  user_id: number
  role_level: number
  username: string
}

export interface SellerForgotPasswordRequest {
  email: string
}

export interface SellerForgotPasswordVerifyRequest {
  otp_id: string
  code: string
}

export interface SellerResetPasswordRequest {
  verify_token: string
  new_password: string
}

// ============================================================
// BUYER AUTH TYPES
// ============================================================

export interface OTPSendResponse {
  otp_id: string
  expires_in: number
}

export interface OTPVerifyResponse {
  verify_token: string
  target: string
}

export interface WAVerifyStartRequest {
  phone_number: string
}

export interface WAVerifyStartResponse {
  nonce: string
  deeplink: string
  expires_in: number
  verify_token?: string | null
  mock_mode: boolean
}

export interface WAVerifyStatusResponse {
  status: string
  verify_token?: string | null
}

export interface BuyerRegisterRequest {
  name: string
  email: string
  phone?: string
  phone_number?: string
  password: string
  verify_token: string
}

export interface BuyerLoginRequest {
  email: string
  password: string
}

export interface BuyerLoginPhoneRequest {
  phone_number: string
  password: string
}

export interface BuyerLoginOTPRequest {
  phone?: string
  phone_number?: string
  verify_token: string
}

export interface BuyerResetPasswordRequest {
  verify_token: string
  new_password: string
}

export interface BuyerAuthResponse {
  access_token: string
  token_type: string
  user_id: number
  role: 'buyer'
  name: string
  email: string
  phone: string
  avatar_url?: string | null
}

export interface BuyerProfileResponse {
  id: number
  name: string
  email: string
  phone: string
  avatar_url?: string | null
  is_verified?: boolean
  is_active?: boolean
}

export interface MessageResponse {
  message?: string
}

// ============================================================
// MAPPERS
// ============================================================

export function sellerRoleFromLevel(roleLevel: number): SellerRole {
  if (roleLevel === 1) return 'owner'
  if (roleLevel === 2) return 'admin'
  return 'staff'
}

export function sellerRoleLabel(role: SellerRole): string {
  if (role === 'owner') return 'Owner / Superadmin'
  if (role === 'admin') return 'Admin'
  return 'Staff'
}

export function mapSellerLoginResponseToUser(data: SellerLoginResponse): User {
  const role = sellerRoleFromLevel(data.role_level)

  return {
    id: String(data.user_id),
    name: data.username,
    username: data.username,
    role,
    roleLevel: data.role_level,
  }
}

export function mapBuyerAuthResponseToUser(data: BuyerAuthResponse): User {
  return {
    id: String(data.user_id),
    name: data.name,
    role: 'buyer',
    email: data.email,
    phone: data.phone,
    avatar_url: data.avatar_url,
  }
}

// ============================================================
// SELLER AUTH API
// ============================================================

export async function loginSeller(
  credentials: SellerLoginCredentials,
): Promise<SellerLoginResponse> {
  const response = await apiClient.post<SellerLoginResponse>(
    '/auth/login',
    credentials,
  )

  return response.data
}

export async function requestSellerForgotPassword(
  payload: SellerForgotPasswordRequest,
): Promise<OTPSendResponse> {
  const response = await apiClient.post<OTPSendResponse>(
    '/auth/seller/forgot-password/request',
    payload,
  )

  return response.data
}

export async function verifySellerForgotPasswordOtp(
  payload: SellerForgotPasswordVerifyRequest,
): Promise<OTPVerifyResponse> {
  const response = await apiClient.post<OTPVerifyResponse>(
    '/auth/seller/forgot-password/verify',
    payload,
  )

  return response.data
}

export async function resetSellerPassword(
  payload: SellerResetPasswordRequest,
): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>(
    '/auth/seller/reset-password',
    payload,
  )

  return response.data
}

// ============================================================
// BUYER AUTH API
// ============================================================

export async function startWAVerification(
  payload: WAVerifyStartRequest,
): Promise<WAVerifyStartResponse> {
  const response = await apiClient.post<WAVerifyStartResponse>(
    '/auth/verify/wa/start',
    {
      ...payload,
      phone_number: formatPhoneNumber(payload.phone_number),
    },
  )

  return response.data
}

export async function getWAVerificationStatus(
  nonce: string,
): Promise<WAVerifyStatusResponse> {
  const response = await apiClient.get<WAVerifyStatusResponse>(
    '/auth/verify/wa/status',
    { params: { nonce } },
  )

  return response.data
}

export async function registerBuyer(
  payload: BuyerRegisterRequest,
): Promise<BuyerAuthResponse> {
  const response = await apiClient.post<BuyerAuthResponse>(
    '/auth/buyer/register',
    {
      ...payload,
      phone: payload.phone ? formatPhoneNumber(payload.phone) : undefined,
      phone_number: payload.phone_number ? formatPhoneNumber(payload.phone_number) : undefined,
    },
  )

  return response.data
}

export async function loginBuyer(
  payload: BuyerLoginRequest,
): Promise<BuyerAuthResponse> {
  const response = await apiClient.post<BuyerAuthResponse>(
    '/auth/buyer/login',
    payload,
  )

  return response.data
}

export async function loginBuyerPhone(
  payload: BuyerLoginPhoneRequest,
): Promise<BuyerAuthResponse> {
  const response = await apiClient.post<BuyerAuthResponse>(
    '/auth/buyer/login-phone',
    {
      ...payload,
      phone_number: formatPhoneNumber(payload.phone_number),
    },
  )

  return response.data
}

export async function loginBuyerOtp(
  payload: BuyerLoginOTPRequest,
): Promise<BuyerAuthResponse> {
  const response = await apiClient.post<BuyerAuthResponse>(
    '/auth/buyer/login/otp',
    {
      ...payload,
      phone: payload.phone ? formatPhoneNumber(payload.phone) : undefined,
      phone_number: payload.phone_number ? formatPhoneNumber(payload.phone_number) : undefined,
    },
  )

  return response.data
}

export async function resetBuyerPassword(
  payload: BuyerResetPasswordRequest,
): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>(
    '/auth/buyer/reset-password',
    payload,
  )

  return response.data
}
export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function requestBuyerForgotPassword(email: string): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/auth/buyer/forgot-password', { email })
  return response.data
}

export async function resetBuyerPasswordEmail(payload: { email: string, otp: string, new_password: string }): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/auth/buyer/reset-password/email', payload)
  return response.data
}

export async function changeBuyerPassword(payload: { current_password: string, new_password: string }): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/buyers/me/change-password', payload)
  return response.data
}

export async function changeBuyerPhone(payload: { current_password: string, phone: string }): Promise<{phone: string}> {
  const response = await apiClient.patch<{phone: string}>('/buyers/me/phone', payload)
  return response.data
}

export async function uploadBuyerAvatar(file: File): Promise<BuyerProfileResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<BuyerProfileResponse>('/buyers/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export async function getBuyerProfile(): Promise<BuyerProfileResponse> {
  const response = await apiClient.get<BuyerProfileResponse>('/buyers/me')
  return response.data
}

