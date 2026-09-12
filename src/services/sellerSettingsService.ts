// src/services/sellerSettingsService.ts
import { apiClient } from '@/api/client';

export type UserRole = 'owner' | 'admin' | 'staff';
export type UserStatus = 'active' | 'inactive';

export interface UserProfile {
  id: number;
  username: string;
  role_id: number;
  email: string;
  phone_number: string;
  is_active: boolean;
}

export interface ShopProfile {
  name: string;
  phone: string;
  address: string;
  description: string;
}

// ============================================================
// DUMMY DATA FOR SHOP
// ============================================================

const dummyShopProfile: ShopProfile = {
  name: 'Toti Cakery',
  phone: '081234567890',
  address: 'JL Kue Manis No. 25, Sukajadi, Bandung, Jawa Barat, 40162',
  description: 'Toko kue rumahan dengan bahan berkualitas dan cita rasa premium.',
};

// ============================================================
// FUNGSI SERVICE
// ============================================================

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getShopProfile(): Promise<ShopProfile> {
  await delay();
  return dummyShopProfile;
}

export async function updateShopProfile(data: Partial<ShopProfile>): Promise<ShopProfile> {
  await delay(500);
  Object.assign(dummyShopProfile, data);
  return dummyShopProfile;
}

export async function getUsers(): Promise<UserProfile[]> {
  const response = await apiClient.get('/users');
  return response.data;
}

export async function getUserById(id: number): Promise<UserProfile | undefined> {
  const users = await getUsers();
  return users.find((u) => u.id === id);
}

export async function getUserByEmail(email: string): Promise<UserProfile | undefined> {
  const users = await getUsers();
  return users.find((u) => u.email === email);
}

export async function getUserByUsername(username: string): Promise<UserProfile | undefined> {
  const users = await getUsers();
  return users.find((u) => u.username === username);
}

export async function addUser(
  data: Omit<UserProfile, 'id' | 'is_active'> & { password?: string }
): Promise<UserProfile> {
  const response = await apiClient.post('/users', data);
  return response.data;
}

export async function updateUser(id: number, data: Partial<UserProfile>): Promise<UserProfile> {
  // Not implemented in this PR but kept for type signature
  await delay(500);
  return { id, ...data } as UserProfile;
}

export async function deleteUser(_id: number): Promise<void> {
  // Not implemented in this PR but kept for type signature
  await delay(500);
}

export async function updateUserPassword(_email: string, _newPassword: string): Promise<void> {
  await delay(500);
}

export async function authenticateUser(_username: string, _password: string): Promise<UserProfile | null> {
  await delay(800);
  return null;
}

export async function updateUserPasswordByEmail(_email: string, _newPassword: string): Promise<void> {
  await delay(500);
}