// src/components/layout/SellerLayout.tsx
import { Outlet } from 'react-router-dom'; // hapus Navigate
import { SellerSidebar } from './SellerSidebar';
import { SellerHeader } from './SellerHeader';

export function SellerLayout() {
  // Untuk sementara, abaikan pengecekan auth
  // const { isAuthenticated, user } = useAuth();
  // if (!isAuthenticated || !isSellerRole(user?.role)) {
  //   return <Navigate to={ROUTES.AUTH_SELLER} replace />;
  // }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SellerSidebar />
      <div className="flex flex-1 flex-col">
        <SellerHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}