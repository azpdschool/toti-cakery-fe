import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Filter, Check, ChevronDown } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface SellerFilterDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  className?: string;
  id?: string;
  label?: string;
  align?: 'left' | 'right';
  ariaLabel?: string;
  placeholder?: string;
  icon?: ReactNode;
  showChevron?: boolean;
}

export function SellerFilterDropdown({
  value,
  onChange,
  options,
  className = '',
  id = 'seller-filter-dropdown',
  label,
  align = 'right',
  ariaLabel,
  placeholder = 'All',
  icon,
  showChevron = false,
}: SellerFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const activeOption = options.find((opt) => opt.value === value);

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 shrink-0 ${className}`} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-gray-500 whitespace-nowrap hidden md:inline"
        >
          {label}
        </label>
      )}

      <div className="relative shrink-0">
        <button
          id={id}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-[#d0bfaf] bg-white px-2.5 py-2 text-xs font-semibold text-[#4b2417] hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#d85b30] shrink-0 sm:px-3 sm:text-sm cursor-pointer transition-colors"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={ariaLabel || label || 'Filter options'}
        >
          {icon ?? <Filter className="h-4 w-4 text-[#8b7166] shrink-0" />}
          <span className="max-w-[72px] sm:max-w-none truncate">
            {activeOption?.label || placeholder}
          </span>
          {showChevron && (
            <ChevronDown
              className={`h-3.5 w-3.5 text-[#8b7166] transition-transform duration-200 shrink-0 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>

        {isOpen && (
          <div
            className={`absolute ${
              align === 'left' ? 'left-0' : 'right-0'
            } top-full mt-1.5 z-50 w-48 rounded-xl border border-[#e6d5c5] bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1`}
            role="listbox"
          >
            <div className="space-y-0.5 max-h-60 overflow-y-auto">
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
                    role="option"
                    aria-selected={isSelected}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#f8eee5] text-[#d85b30] font-semibold'
                        : 'text-[#4b2417] hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-[#d85b30] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
