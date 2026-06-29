// src/services/sellerSettingsService.ts

export type UserRole = 'owner' | 'admin' | 'staff';
export type UserStatus = 'active' | 'inactive';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  phone: string;
  email?: string;
  password?: string; // dummy, untuk testing
  status: UserStatus;
  joinedAt: string;
  lastLogin?: string;
}

export interface ShopProfile {
  name: string;
  phone: string;
  address: string;
  description: string;
}

// ============================================================
// DUMMY DATA
// ============================================================

const dummyShopProfile: ShopProfile = {
  name: 'Toti Cakery',
  phone: '081234567890',
  address: 'JL Kue Manis No. 25, Sukajadi, Bandung, Jawa Barat, 40162',
  description: 'Toko kue rumahan dengan bahan berkualitas dan cita rasa premium.',
};

const dummyUsers: UserProfile[] = [
  {
    id: '1',
    name: 'Jake Hartono',
    username: 'jake',
    role: 'owner',
    phone: '0812-3456-7890',
    email: 'jake@toticakery.com',
    password: 'owner123',
    status: 'active',
    joinedAt: '10 Jan 2026',
    lastLogin: '25 Mei 2026, 09:12 WIB',
  },
  {
    id: '2',
    name: 'Ayu Admin',
    username: 'ayu',
    role: 'admin',
    phone: '0813-2345-6789',
    email: 'ayu@toticakery.com',
    password: 'admin123',
    status: 'active',
    joinedAt: '15 Jan 2026',
    lastLogin: '24 Mei 2026, 14:30 WIB',
  },
  {
    id: '3',
    name: 'Dani Staff',
    username: 'dani',
    role: 'staff',
    phone: '0815-4567-8901',
    email: 'dani@toticakery.com',
    password: 'staff123',
    status: 'active',
    joinedAt: '1 Feb 2026',
    lastLogin: '22 Mei 2026, 08:45 WIB',
  },
];

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
  await delay();
  return dummyUsers;
}

export async function getUserById(id: string): Promise<UserProfile | undefined> {
  await delay();
  return dummyUsers.find((u) => u.id === id);
}

export async function getUserByEmail(email: string): Promise<UserProfile | undefined> {
  await delay();
  return dummyUsers.find((u) => u.email === email);
}

export async function getUserByUsername(username: string): Promise<UserProfile | undefined> {
  await delay();
  return dummyUsers.find((u) => u.username === username);
}

export async function addUser(
  data: Omit<UserProfile, 'id' | 'joinedAt' | 'status'>
): Promise<UserProfile> {
  await delay(500);
  const newUser: UserProfile = {
    id: `user-${Date.now()}`,
    ...data,
    status: 'active',
    joinedAt: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    lastLogin: '-',
  };
  dummyUsers.push(newUser);
  return newUser;
}

export async function updateUser(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
  await delay(500);
  const user = dummyUsers.find((u) => u.id === id);
  if (!user) throw new Error('User not found');
  Object.assign(user, data);
  return user;
}

export async function deleteUser(id: string): Promise<void> {
  await delay(500);
  const index = dummyUsers.findIndex((u) => u.id === id);
  if (index !== -1 && dummyUsers[index].role !== 'owner') {
    dummyUsers.splice(index, 1);
  }
}

export async function updateUserPassword(email: string, newPassword: string): Promise<void> {
  await delay(500);
  const user = dummyUsers.find((u) => u.email === email);
  if (user) {
    user.password = newPassword;
  }
}

// Fungsi untuk login (dummy)
export async function authenticateUser(username: string, password: string): Promise<UserProfile | null> {
  await delay(800);
  const user = dummyUsers.find(
    (u) =>
      (u.username === username || u.email === username) && u.password === password
  );
  return user || null;
}

export async function updateUserPasswordByEmail(email: string, newPassword: string): Promise<void> {
  await delay(500);
  const user = dummyUsers.find((u) => u.email === email);
  if (user) {
    user.password = newPassword;
  }
}