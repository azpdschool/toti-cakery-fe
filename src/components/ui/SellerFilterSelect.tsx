import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface FilterSelectOption {
  label: string;
  value: string;
}

export interface SellerFilterSelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: FilterSelectOption[];
  placeholder?: string;
  className?: string;
  id?: string;
}

export function SellerFilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'All',
  className = '',
  id,
}: SellerFilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-[#4b2417] mb-1">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm text-[#4b2417] outline-none hover:bg-gray-50 focus:border-[#d85b30] transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-4 w-4 text-[#8b7166] transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-1 w-full rounded-lg border border-[#e6d5c5] bg-[#fffcf9] p-1 shadow-md max-h-48 overflow-y-auto space-y-0.5 z-30">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs sm:text-sm font-medium transition-colors ${
              value === ''
                ? 'bg-[#f8eee5] text-[#d85b30] font-semibold'
                : 'text-[#4b2417] hover:bg-gray-50'
            }`}
          >
            <span className="truncate pr-2">{placeholder}</span>
            {value === '' && <Check className="h-3.5 w-3.5 text-[#d85b30] shrink-0" />}
          </button>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs sm:text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#f8eee5] text-[#d85b30] font-semibold'
                    : 'text-[#4b2417] hover:bg-gray-50'
                }`}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#d85b30] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
