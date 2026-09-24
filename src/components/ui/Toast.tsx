import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!toast || isPaused) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, toast.duration || 10000);

    return () => clearTimeout(timer);
  }, [toast, isPaused]);

  const showToast = (options: ToastOptions) => {
    setToast({ ...options, id: Date.now() });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && createPortal(
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center pointer-events-none">
          <div 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg pointer-events-auto border transition-all duration-300 transform translate-y-0 opacity-100 ${
              toast.type === 'error' ? 'bg-white border-red-200 text-red-800' : 
              toast.type === 'success' ? 'bg-white border-green-200 text-green-800' : 
              'bg-white border-blue-200 text-blue-800'
            }`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            role="alert"
          >
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {(toast.type === 'info' || !toast.type) && <Info className="w-5 h-5 text-blue-500" />}
            
            <p className="text-sm font-medium">{toast.message}</p>
            
            <button 
              onClick={() => setToast(null)}
              className="ml-4 p-1 hover:bg-black/5 rounded-full transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4 opacity-60" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
