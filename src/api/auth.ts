// src/api/auth.ts
import { apiClient } from './client'
import type { SellerRole, User } from '@/types'

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
    payload,
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
    payload,
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
    payload,
  )

  return response.data
}

export async function loginBuyerOtp(
  payload: BuyerLoginOTPRequest,
): Promise<BuyerAuthResponse> {
  const response = await apiClient.post<BuyerAuthResponse>(
    '/auth/buyer/login/otp',
    payload,
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
