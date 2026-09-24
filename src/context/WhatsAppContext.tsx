import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPublicContact } from '@/services/whatsappService';

interface WhatsAppContextType {
  whatsappNumber: string | null;
  whatsappNumberDisplay: string | null;
  whatsappUrl: string | null;
  loading: boolean;
}

const WhatsAppContext = createContext<WhatsAppContextType>({
  whatsappNumber: null,
  whatsappNumberDisplay: null,
  whatsappUrl: null,
  loading: true,
});

export const WhatsAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchNumber = async () => {
      try {
        const { whatsapp } = await getPublicContact();
        if (isMounted) setWhatsappNumber(whatsapp);
      } catch (error) {
        console.error('Failed to fetch public WhatsApp number', error);
        // Fallback handled by backend, but just in case it fails completely
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchNumber();
    return () => { isMounted = false; };
  }, []);

  const whatsappNumberDisplay = whatsappNumber
    ? `+${whatsappNumber.slice(0, 2)} ${whatsappNumber.slice(2).replace(/(\d{4})/g, '$1-').replace(/-$/, '')}`
    : null;

  const message = 'Halo Toti Cakery! Saya ingin bertanya tentang...';
  const whatsappUrl = whatsappNumber 
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    : null;

  return (
    <WhatsAppContext.Provider value={{ whatsappNumber, whatsappNumberDisplay, whatsappUrl, loading }}>
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsApp = () => useContext(WhatsAppContext);
