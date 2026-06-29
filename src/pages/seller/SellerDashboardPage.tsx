import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign,
  Box,
  AlertTriangle,
  CircleOff,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { getAllProducts, formatRupiah, type SimpleProduct } from '@/services/productService';
import {
  getDashboardStats,
  getSalesChartData,
  getOrderSummary,
  getStockSummary,
  type DashboardStats,
  type SalesChartData,
  type OrderSummaryItem,
  type StockSummaryItem,
} from '@/services/sellerService';

// ============================================================
// KOMPONEN KECIL
// ============================================================

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ElementType;
}

function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Icon className="h-5 w-5 text-[#6f5448]" />
        </div>
        <span className="text-xs font-semibold text-green-700">{change}</span>
      </div>
      <p className="mt-3 text-xl font-black text-[#4b2417]">{value}</p>
      <p className="mt-1 text-sm text-[#6f5448]">{title}</p>
    </div>
  );
}

interface SalesChartProps {
  data: SalesChartData[];
}

function SalesChart({ data }: SalesChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-[#4b2417]">Grafik Penjualan 7 Hari Terakhir</h3>
      <div className="mt-4 flex h-48 items-end gap-2">
        {data.map((item) => (
          <div key={item.day} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-[#d85b30] transition-all"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            />
            <span className="text-xs font-medium text-[#6f5448]">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface OrderSummaryProps {
  data: OrderSummaryItem[];
}

function OrderSummary({ data }: OrderSummaryProps) {
  const iconMap: Record<string, React.ElementType> = {
    selesai: CheckCircle,
    diproses: Clock,
    menunggu: AlertCircle,
    dibatalkan: XCircle,
    dibayar: DollarSign,
  };

  const colorMap: Record<string, string> = {
    selesai: 'text-green-600',
    diproses: 'text-blue-600',
    menunggu: 'text-yellow-600',
    dibatalkan: 'text-red-600',
    dibayar: 'text-emerald-600',
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-[#4b2417]">Ringkasan Order</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {data.map((item) => {
          const Icon = iconMap[item.status];
          const color = colorMap[item.status] || 'text-gray-600';
          return (
            <div key={item.status} className="flex flex-col items-center rounded-lg bg-gray-50 p-3 text-center">
              {Icon && <Icon className={`h-5 w-5 ${color}`} />}
              <span className="mt-1 text-lg font-black text-[#4b2417]">{item.count}</span>
              <span className="text-xs font-medium text-[#6f5448]">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StockSummaryProps {
  data: StockSummaryItem[];
}

function StockSummary({ data }: StockSummaryProps) {
  const iconMap: Record<string, React.ElementType> = {
    safe: Box,
    low: AlertTriangle,
    empty: CircleOff,
    all: Package,
  };

  const colorMap: Record<string, string> = {
    safe: 'text-green-600',
    low: 'text-yellow-600',
    empty: 'text-red-600',
    all: 'text-blue-600',
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-[#4b2417]">Stok Bahan</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.map((item) => {
          const Icon = iconMap[item.type];
          const color = colorMap[item.type] || 'text-gray-600';
          return (
            <div key={item.label} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              {Icon && <Icon className={`h-5 w-5 ${color}`} />}
              <div>
                <p className="text-lg font-black text-[#4b2417]">{item.count}</p>
                <p className="text-xs font-medium text-[#6f5448]">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ProductTableProps {
  products: SimpleProduct[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

function ProductTable({ products, currentPage, itemsPerPage, onPageChange }: ProductTableProps) {
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#4b2417]">Ringkasan Produk</h3>
        <Link
          to={ROUTES.SELLER_PRODUCTS}
          className="rounded bg-[#d85b30] px-4 py-1.5 text-xs font-black text-white transition hover:bg-[#c04e28]"
        >
          Tambah Produk
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
              <th className="pb-2 pr-4">NO</th>
              <th className="pb-2 pr-4">PRODUK</th>
              <th className="pb-2 pr-4">KATEGORI</th>
              <th className="pb-2 pr-4">HARGA</th>
              <th className="pb-2 pr-4">STOK</th>
              <th className="pb-2 pr-4">STATUS</th>
              <th className="pb-2 pr-4">TERJUAL (BLN INI)</th>
              <th className="pb-2">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product, idx) => {
              // Data dummy untuk stok dan status
              const stock = Math.floor(Math.random() * 50) + 1;
              const isActive = Math.random() > 0.2;
              const soldThisMonth = Math.floor(Math.random() * 150) + 10;

              return (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4 text-[#6f5448]">{startIndex + idx + 1}</td>
                  <td className="py-3 pr-4 font-medium text-[#4b2417]">{product.name}</td>
                  <td className="py-3 pr-4 text-[#6f5448]">{product.category}</td>
                  <td className="py-3 pr-4 font-medium text-[#4b2417]">{formatRupiah(product.price)}</td>
                  <td className="py-3 pr-4 text-[#6f5448]">{stock} pcs</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[#6f5448]">{soldThisMonth} pcs</td>
                  <td className="py-3">
                    <button className="text-xs font-semibold text-[#d85b30] hover:text-[#c04e28]">
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[#6f5448]">
        <div>
          Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, products.length)} dari {products.length} produk
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">5 / halaman</span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                  page === currentPage
                    ? 'bg-[#d85b30] text-white'
                    : 'bg-gray-200 text-[#6f5448] hover:bg-gray-300'
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SellerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<SalesChartData[]>([]);
  const [orderSummary, setOrderSummary] = useState<OrderSummaryItem[]>([]);
  const [stockSummary, setStockSummary] = useState<StockSummaryItem[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [statsData, chart, orders, stock, productList] = await Promise.all([
          getDashboardStats(),
          getSalesChartData(),
          getOrderSummary(),
          getStockSummary(),
          getAllProducts(),
        ]);
        setStats(statsData);
        setChartData(chart);
        setOrderSummary(orders);
        setStockSummary(stock);
        setProducts(productList);
      } catch (error) {
        console.error('Gagal memuat data dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Reset halaman jika produk berubah
  const totalPages = Math.ceil(products.length / itemsPerPage);
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
      </div>
    );
  }

  // Definisikan stat card dengan ikon
  const statCards = [
    {
      title: 'Total Pendapatan (Bulan Ini)',
      value: stats?.totalRevenue || 'Rp 0',
      change: stats?.revenueChange || '',
      icon: TrendingUp,
    },
    {
      title: 'Total Order (Bulan Ini)',
      value: stats?.totalOrders || 0,
      change: stats?.ordersChange || '',
      icon: ShoppingBag,
    },
    {
      title: 'Total Pelanggan',
      value: stats?.totalCustomers || 0,
      change: stats?.customersChange || '',
      icon: Users,
    },
    {
      title: 'Produk Terjual (Bulan Ini)',
      value: stats?.totalSold || '0 pcs',
      change: stats?.soldChange || '',
      icon: Package,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistik */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Grafik & Ringkasan Order */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SalesChart data={chartData} />
        <OrderSummary data={orderSummary} />
      </div>

      {/* Ringkasan Stok */}
      <StockSummary data={stockSummary} />

      {/* Tabel Produk */}
      <ProductTable
        products={products}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}