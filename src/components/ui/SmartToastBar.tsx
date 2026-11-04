import React, { useState } from 'react';
import { useToaster, toast, resolveValue, type Toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Panduan Durasi Notifikasi:
 * • Pesan Pendek (1–3 kata): 3 hingga 4 detik (default 3500ms).
 * • Pesan Menengah (4–7 kata): 5 hingga 7 detik (default 6000ms).
 * • Pesan Panjang atau Penting: 8 hingga 10 detik (default 9000ms).
 */
export function calculateToastDuration(
  message: any,
  type?: string,
  explicitDuration?: number
): number {
  if (explicitDuration && explicitDuration > 0 && explicitDuration !== 4000) {
    return explicitDuration;
  }

  let text = '';
  if (typeof message === 'string') {
    text = message;
  } else if (typeof message === 'function') {
    try {
      const res = message({} as any);
      if (typeof res === 'string') text = res;
    } catch {
      text = '';
    }
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  if (type === 'error' || type === 'loading' || wordCount >= 8) {
    return 9000;
  }
  if (wordCount >= 4) {
    return 6000;
  }
  return 3500;
}

let isToastMonkeyPatched = false;

/**
 * Injects smart duration calculation globally into react-hot-toast methods.
 */
export function setupSmartToastDurations(): void {
  if (isToastMonkeyPatched) return;
  isToastMonkeyPatched = true;

  const originalSuccess = toast.success;
  toast.success = (message, opts) => {
    const duration = opts?.duration ?? calculateToastDuration(message, 'success');
    return originalSuccess(message, { ...opts, duration });
  };

  const originalError = toast.error;
  toast.error = (message, opts) => {
    const duration = opts?.duration ?? calculateToastDuration(message, 'error');
    return originalError(message, { ...opts, duration });
  };

  const originalLoading = toast.loading;
  toast.loading = (message, opts) => {
    return originalLoading(message, opts);
  };
}

interface SmartToastCardProps {
  toast: Toast;
  onClose: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export const SmartToastCard: React.FC<SmartToastCardProps> = ({
  toast: t,
  onClose,
  onPause,
  onResume,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const message = resolveValue(t.message, t);
  const duration = t.duration || 4000;

  const handlePointerEnter = () => {
    setIsHovered(true);
    onPause?.();
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    onResume?.();
  };

  const getTypeStyles = () => {
    switch (t.type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
          borderColor: 'border-emerald-200',
          progressBarColor: 'bg-emerald-500',
          bgTint: 'bg-emerald-50',
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          borderColor: 'border-rose-200',
          progressBarColor: 'bg-rose-500',
          bgTint: 'bg-rose-50',
        };
      case 'loading':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />,
          borderColor: 'border-amber-200',
          progressBarColor: 'bg-amber-500',
          bgTint: 'bg-amber-50',
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

  const { icon, borderColor, progressBarColor, bgTint } = getTypeStyles();

  return (
    <div
      role="alert"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onTouchStart={handlePointerEnter}
      onTouchEnd={handlePointerLeave}
      className={`relative w-[calc(100vw-32px)] sm:w-auto sm:max-w-md bg-white shadow-xl rounded-xl border ${borderColor} p-3.5 transition-all duration-200 transform ${
        t.visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-2 opacity-0 scale-95'
      } pointer-events-auto overflow-hidden select-none sm:select-auto`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg ${bgTint} shrink-0`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="text-xs sm:text-sm font-semibold text-[#3A1F16] leading-snug break-words">
            {message}
          </div>
        </div>

        {/* Quick Close 'X' Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="p-1 -mr-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Shrinking Animated Progress Line at the Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
        <div
          className={`h-full ${progressBarColor}`}
          style={{
            animation: `toastProgressBar ${duration}ms linear forwards`,
            animationPlayState: isHovered ? 'paused' : 'running',
          }}
        />
      </div>
    </div>
  );
};

export const SmartToastBar = SmartToastCard;

/**
 * Top-anchored Toaster component using react-hot-toast useToaster hook.
 * Handles instant pause-on-hover on pointerenter/mouseenter without requiring click.
 */
export function SmartToaster() {
  const { toasts, handlers } = useToaster();
  const { startPause, endPause, calculateOffset, updateHeight } = handlers;

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
        top: 16,
        right: 16,
        left: 16,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {toasts.map((t) => {
        const offset = calculateOffset(t, { gutter: 10, defaultPosition: 'top-right' });
        const ref = (el: HTMLDivElement | null) => {
          if (el && typeof t.height !== 'number') {
            const height = el.getBoundingClientRect().height;
            updateHeight(t.id, height);
          }
        };

        return (
          <div
            key={t.id}
            ref={ref}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              transform: `translateY(${offset}px)`,
              transition: 'all 230ms cubic-bezier(.21,1.02,.73,1)',
              pointerEvents: 'auto',
            }}
            onPointerEnter={startPause}
            onPointerLeave={endPause}
            onMouseEnter={startPause}
            onMouseLeave={endPause}
            onTouchStart={startPause}
            onTouchEnd={endPause}
          >
            <SmartToastCard
              toast={t}
              onClose={() => toast.dismiss(t.id)}
              onPause={startPause}
              onResume={endPause}
            />
          </div>
        );
      })}
    </div>
  );
}
