/**
 * Utility to detect whether the Midtrans payment environment is in Sandbox or Production.
 * Automatically adapts based on the returned payment/QRIS URL or environment variable.
 */
export function isMidtransSandbox(paymentUrl?: string | null): boolean {
  if (paymentUrl) {
    // If the payment URL contains api.midtrans.com and NOT sandbox.midtrans.com, it is live Production
    if (paymentUrl.includes('api.midtrans.com') && !paymentUrl.includes('sandbox.midtrans.com')) {
      return false;
    }
    // If the URL explicitly contains sandbox.midtrans.com
    if (paymentUrl.includes('sandbox.midtrans.com')) {
      return true;
    }
  }

  // Check explicit environment variable (e.g. VITE_MIDTRANS_SANDBOX='false' or '0')
  const envVal = import.meta.env.VITE_MIDTRANS_SANDBOX;
  if (envVal === 'false' || envVal === '0') {
    return false;
  }

  // Default to true for sandbox/development environments
  return true;
}

export const MIDTRANS_SIMULATOR_URL = 'https://simulator.sandbox.midtrans.com/';
