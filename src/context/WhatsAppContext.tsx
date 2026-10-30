import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPublicContact } from '@/services/whatsappService';

interface WhatsAppContextType {
  whatsappNumber: string | null;
  whatsappNumberDisplay: string | null;
  whatsappUrl: string | null;
  getWhatsAppUrl: (customMessage?: string) => string;
  loading: boolean;
  refetch: (force?: boolean) => Promise<void>;
}

const WhatsAppContext = createContext<WhatsAppContextType>({
  whatsappNumber: null,
  whatsappNumberDisplay: null,
  whatsappUrl: null,
  getWhatsAppUrl: () => '#',
  loading: true,
  refetch: async () => {},
});

export const WhatsAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNumber = async (force: boolean = false) => {
    try {
      const { whatsapp } = await getPublicContact(force);
      if (whatsapp) {
        setWhatsappNumber(whatsapp);
      }
    } catch (error) {
      console.error('Failed to fetch public WhatsApp number', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNumber(false);

    const handleFocus = () => {
      fetchNumber(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNumber(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const whatsappNumberDisplay = whatsappNumber
    ? (whatsappNumber.startsWith('62')
        ? `+62 ${whatsappNumber.slice(2).replace(/(\d{4})/g, '$1-').replace(/-$/, '')}`
        : whatsappNumber)
    : null;

  const defaultMessage = 'Halo Toti Cakery! Saya ingin bertanya tentang produk dan pesanan saya.';
  const defaultWhatsAppUrl = whatsappNumber 
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`
    : '#';

  const getWhatsAppUrl = (customMessage?: string) => {
    if (!whatsappNumber) return '#';
    const text = customMessage || defaultMessage;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <WhatsAppContext.Provider
      value={{
        whatsappNumber,
        whatsappNumberDisplay,
        whatsappUrl: defaultWhatsAppUrl,
        getWhatsAppUrl,
        loading,
        refetch: () => fetchNumber(true),
      }}
    >
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsApp = () => useContext(WhatsAppContext);
