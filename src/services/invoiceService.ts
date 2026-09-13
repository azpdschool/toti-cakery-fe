import { downloadOrderInvoicePdfAPI } from '@/api/order';

export async function downloadInvoice(orderId: string | number) {
  try {
    const response = await downloadOrderInvoicePdfAPI(orderId);
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
      throw new Error('Sesi anda telah berakhir. Silakan login kembali.');
    } else if (error.response?.status === 403) {
      throw new Error('Anda tidak memiliki izin untuk mengunduh invoice ini.');
    } else if (error.response?.status === 404) {
      throw new Error('Pesanan atau invoice tidak ditemukan.');
    } else {
      throw new Error('Gagal mengunduh invoice. Silakan coba lagi.');
    }
  }
}
