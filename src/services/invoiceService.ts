import { downloadOrderInvoicePdfAPI } from '@/api/order';
import i18n from '@/lib/i18n';
import { LANG_KEY } from '@/constants';

export async function downloadInvoice(orderId: string | number, lang?: string) {
  const currentLang =
    lang ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/seller') ? 'en' : i18n.language) ||
    (typeof window !== 'undefined' ? localStorage.getItem(LANG_KEY) : null) ||
    'id';
  const isEn = currentLang.startsWith('en');

  try {
    const response = await downloadOrderInvoicePdfAPI(orderId, currentLang);
    const blob = response.data;
    
    // Attempt to extract filename from Content-Disposition
    let filename = `Invoice-TotiCakery-${orderId}.pdf`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }
    
    // Create object URL and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Error downloading invoice:', error);
    
    // Handle error readable messages
    if (error.response?.status === 401) {
      throw new Error(isEn ? 'Your session has expired. Please log in again.' : 'Sesi anda telah berakhir. Silakan login kembali.');
    } else if (error.response?.status === 403) {
      throw new Error(isEn ? 'You do not have permission to download this invoice.' : 'Anda tidak memiliki izin untuk mengunduh invoice ini.');
    } else if (error.response?.status === 404) {
      throw new Error(isEn ? 'Order or invoice not found.' : 'Pesanan atau invoice tidak ditemukan.');
    } else {
      throw new Error(isEn ? 'Failed to download invoice. Please try again.' : 'Gagal mengunduh invoice. Silakan coba lagi.');
    }
  }
}
