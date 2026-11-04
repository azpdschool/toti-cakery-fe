import { Filter, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { SellerFilterSelect } from './SellerFilterSelect';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  id: string;
  label: string;
  options?: FilterOption[];
  type?: 'select' | 'date';
}

interface MultiFilterPopoverProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onClear: () => void;
  buttonLabel?: string;
}

export function MultiFilterPopover({
  fields,
  values,
  onChange,
  onClear,
  buttonLabel = 'Filter',
}: MultiFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const activeCount = Object.values(values).filter(Boolean).length;

  return (
    <div className="relative inline-block text-left shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 sm:gap-2 justify-center rounded-lg px-2.5 py-2 text-xs sm:px-3.5 sm:text-sm font-semibold transition-colors border shrink-0 cursor-pointer ${
          activeCount > 0 
            ? 'bg-[#fffaf5] border-[#d85b30] text-[#d85b30]' 
            : 'bg-white border-[#d0bfaf] text-[#4b2417] hover:bg-gray-50'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={buttonLabel}
      >
        <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8b7166] shrink-0" />
        <span className="hidden sm:inline">{buttonLabel}</span>
        {activeCount > 0 && (
          <span className="rounded-full bg-[#d85b30] text-white px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          ref={popoverRef}
          className="absolute right-0 z-50 mt-2 w-[min(300px,calc(100vw-2rem))] sm:w-80 origin-top-right rounded-2xl border border-[#e6d5c5] bg-white p-3.5 sm:p-5 shadow-xl max-h-[75dvh] overflow-y-auto animate-in fade-in slide-in-from-top-2"
        >
          <div className="pb-3 mb-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#4b2417]">Filters</h3>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button 
                  type="button"
                  onClick={() => {
                    onClear();
                    setIsOpen(false);
                  }}
                  className="text-xs sm:text-sm text-[#d85b30] hover:text-[#b94a24] font-semibold transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="block text-xs font-semibold text-[#4b2417] mb-1">
                  {field.label}
                </label>
                {field.type === 'date' ? (
                  <input
                    type="date"
                    value={values[field.id] || ''}
                    onChange={(e) => onChange({ ...values, [field.id]: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs sm:text-sm text-[#4b2417] outline-none focus:border-[#d85b30] bg-white transition-colors"
                  />
                ) : (
                  <SellerFilterSelect
                    value={values[field.id] || ''}
                    onChange={(val) => onChange({ ...values, [field.id]: val })}
                    options={field.options || []}
                    placeholder="All"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 mt-3 border-t border-gray-100 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onClear();
                setIsOpen(false);
              }}
              className="flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg text-white bg-[#d85b30] hover:bg-[#c04e28] transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
