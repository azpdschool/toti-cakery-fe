// src/services/buyerService.ts

export interface BuyerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // dummy
  createdAt: string;
}

// Dummy data buyer
const dummyBuyers: BuyerProfile[] = [
  {
    id: 'b1',
    name: 'JiantaraDahayu Doe',
    email: 'john@example.com',
    phone: '081234567890',
    password: 'buyer123',
    createdAt: '2026-01-10',
  },
  {
    id: 'b2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '082345678901',
    password: 'buyer123',
    createdAt: '2026-02-15',
  },
];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getBuyerByEmail(email: string): Promise<BuyerProfile | undefined> {
  await delay();
  return dummyBuyers.find((b) => b.email === email);
}

export async function getBuyerByPhone(phone: string): Promise<BuyerProfile | undefined> {
  await delay();
  // Normalize phone: remove spaces, dashes, etc.
  const normalized = phone.replace(/[\s\-\(\)]/g, '');
  return dummyBuyers.find((b) => b.phone.replace(/[\s\-\(\)]/g, '') === normalized);
}

export async function updateBuyerPassword(email: string, newPassword: string): Promise<void> {
  await delay(500);
  const buyer = dummyBuyers.find((b) => b.email === email);
  if (buyer) {
    buyer.password = newPassword;
  }
}

export async function addBuyer(data: Omit<BuyerProfile, 'id' | 'createdAt'>): Promise<BuyerProfile> {
  await delay(500);
  const newBuyer: BuyerProfile = {
    id: `b${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString().split('T')[0],
  };
  dummyBuyers.push(newBuyer);
  return newBuyer;
}