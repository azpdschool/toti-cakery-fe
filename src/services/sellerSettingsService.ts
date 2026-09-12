import { apiClient } from '@/api/client';

export type UserRole = "owner" | "admin" | "staff";
export type UserStatus = "active" | "inactive";
export interface UserProfile {
  id: number;
  username: string;
  role_id: number;
  role_name?: string;
  email: string | null;
  phone_number: string | null;
  nomor_wa_admin: string | null;
  handles_takeover: boolean;
  is_active: boolean;
  avatar_url: string | null;
}

export interface UserProfileUpdate {
  username?: string;
  email?: string;
  phone_number?: string;
  nomor_wa_admin?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface UserAdminUpdate {
  username?: string;
  email?: string;
  phone_number?: string;
  nomor_wa_admin?: string;
  role_id?: number;
  is_active?: boolean;
  password?: string;
}

// ── CURRENT USER PROFILE ────────────────────────────────────

export async function getMyProfile(): Promise<UserProfile> {
  const response = await apiClient.get('/users/me');
  return response.data;
}

export async function updateMyProfile(data: UserProfileUpdate): Promise<UserProfile> {
  const response = await apiClient.put('/users/me', data);
  return response.data;
}

export async function changeMyPassword(data: ChangePasswordRequest): Promise<void> {
  await apiClient.post('/users/me/change-password', data);
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

// ── USER MANAGEMENT (OWNER ONLY) ────────────────────────────

export async function getUsers(): Promise<UserProfile[]> {
  const response = await apiClient.get('/users');
  return response.data;
}

export async function addUser(
  data: any
): Promise<UserProfile> {
  const response = await apiClient.post('/users', data);
  return response.data;
}

export async function updateUser(id: number, data: UserAdminUpdate): Promise<UserProfile> {
  const response = await apiClient.put(`/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

