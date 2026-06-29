import { useAuth } from '@/hooks/useAuth';

export function SellerHeader() {
  const { user } = useAuth();
  const today = new Date();
  const formattedDate = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-2xl font-bold text-[#4b2417]">Halo, {user?.name || 'Seller'}!</h1>
        <p className="text-sm text-[#6f5448]">{formattedDate}</p>
      </div>
      {/* bisa tambahkan avatar / notifikasi di sini */}
    </header>
  );
}