import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { calculateToastDuration } from './SmartToastBar';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
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

interface ActiveToast extends ToastOptions {
  id: number;
  calculatedDuration: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const remainingRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer helper
  const clearDismissTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!toast) {
      clearDismissTimer();
      setIsPaused(false);
      return;
    }

    // Initialize timer for new toast
    remainingRef.current = toast.calculatedDuration;
    startTimeRef.current = Date.now();
    setIsPaused(false);

    clearDismissTimer();
    timerRef.current = setTimeout(() => {
      setToast(null);
    }, remainingRef.current);

    return () => clearDismissTimer();
  }, [toast?.id]);

  const handleMouseEnter = () => {
    if (!toast) return;
    setIsPaused(true);
    clearDismissTimer();
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    if (!toast) return;
    setIsPaused(false);
    startTimeRef.current = Date.now();

    if (remainingRef.current > 0) {
      clearDismissTimer();
      timerRef.current = setTimeout(() => {
        setToast(null);
      }, remainingRef.current);
    } else {
      setToast(null);
    }
  };

  const showToast = (options: ToastOptions) => {
    const calculatedDuration = calculateToastDuration(options.message, options.type, options.duration);
    setToast({
      ...options,
      calculatedDuration,
      id: Date.now(),
    });
  };

  const getStyleConfig = () => {
    switch (toast?.type) {
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          borderColor: 'border-rose-200',
          progressBarColor: 'bg-rose-500',
          bgTint: 'bg-rose-50',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
          borderColor: 'border-emerald-200',
          progressBarColor: 'bg-emerald-500',
          bgTint: 'bg-emerald-50',
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-[#9B4A2F] shrink-0" />,
          borderColor: 'border-[#EAD8CA]',
          progressBarColor: 'bg-[#9B4A2F]',
          bgTint: 'bg-[#FAF5EF]',
        };
    }
  };

  const { icon, borderColor, progressBarColor, bgTint } = getStyleConfig();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && createPortal(
        <div className="fixed top-4 right-4 z-[9999] sm:top-5 sm:right-6 flex flex-col items-end pointer-events-none">
          <div
            className={`relative w-[calc(100vw-32px)] sm:w-auto sm:max-w-md bg-white shadow-xl rounded-xl border ${borderColor} p-3.5 pointer-events-auto transition-all duration-200 transform translate-y-0 opacity-100 overflow-hidden select-none sm:select-auto`}
            onPointerEnter={handleMouseEnter}
            onPointerLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleMouseEnter}
            onTouchEnd={handleMouseLeave}
            role="alert"
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${bgTint} shrink-0`}>
                {icon}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs sm:text-sm font-semibold text-[#3A1F16] leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              {/* Quick Dismiss Button */}
              <button
                type="button"
                onClick={() => setToast(null)}
                className="p-1 -mr-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shrinking Animated Progress Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
              <div
                className={`h-full ${progressBarColor}`}
                style={{
                  animation: `toastProgressBar ${toast.calculatedDuration}ms linear forwards`,
                  animationPlayState: isPaused ? 'paused' : 'running',
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
