import { Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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
}

export function MultiFilterPopover({
  fields,
  values,
  onChange,
  onClear
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCount = Object.values(values).filter(Boolean).length;

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors border ${
          activeCount > 0 
            ? 'bg-[#fffaf5] border-[#d85b30] text-[#d85b30]' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Filter className="w-4 h-4" />
        Filter
        {activeCount > 0 && (
          <span className="ml-1 rounded-full bg-[#d85b30] text-white px-2 py-0.5 text-xs">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          ref={popoverRef}
          className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in slide-in-from-top-2"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Filters</h3>
            {activeCount > 0 && (
              <button 
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="text-sm text-[#d85b30] hover:text-[#b94a24] font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {fields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                {field.type === 'date' ? (
                  <input
                    type="date"
                    value={values[field.id] || ''}
                    onChange={(e) => onChange({ ...values, [field.id]: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#d85b30] focus:ring-[#d85b30] sm:text-sm p-2 border"
                  />
                ) : (
                  <select
                    value={values[field.id] || ''}
                    onChange={(e) => onChange({ ...values, [field.id]: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#d85b30] focus:ring-[#d85b30] sm:text-sm p-2 border bg-white"
                  >
                    <option value="">All</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
