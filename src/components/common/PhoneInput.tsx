// src/components/common/PhoneInput.tsx
import React, { useCallback } from 'react';
import {
  PhoneInput as BasePhoneInput,
} from 'react-international-phone';
import 'react-international-phone/style.css';

export interface InternationalPhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  label?: string;
  error?: string | null;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  defaultCountry?: string;
}

/**
 * Reusable International Phone Input component with:
 * - Default Country: Indonesia (+62)
 * - Auto-removal of leading '0' after country code (e.g., +62 0812 -> +62812)
 * - E.164 output format
 * - Toti Cakery theme styling with pure TypeScript
 */
export const InternationalPhoneInput: React.FC<InternationalPhoneInputProps> = ({
  value,
  onChange,
  label,
  error,
  helperText,
  placeholder = '812 3456 7890',
  disabled = false,
  required = false,
  className = '',
  id = 'phone-input',
  name = 'phone',
  defaultCountry = 'id',
}) => {
  // Handler untuk membersihkan leading zero (0) setelah kode negara
  const handlePhoneChange = useCallback(
    (phone: string) => {
      // Jika user mengetik +620821..., ubah otomatis menjadi +62821...
      const formatted = phone.replace(/^(\+\d{1,4})0+/, '$1');
      onChange(formatted);
    },
    [onChange]
  );

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f5448]"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={`relative flex items-center rounded-xl border bg-white transition-all ${
          error
            ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20'
            : 'border-[#d0bfaf] focus-within:border-[#d85b30] focus-within:ring-2 focus-within:ring-[#d85b30]/20'
        } ${disabled ? 'cursor-not-allowed bg-gray-50 opacity-60' : ''}`}
      >
        <BasePhoneInput
          defaultCountry={defaultCountry}
          value={value}
          onChange={handlePhoneChange}
          disabled={disabled}
          placeholder={placeholder}
          inputProps={{
            id,
            name,
            required,
            className:
              'w-full bg-transparent px-3 py-3 text-sm text-[#4b2417] placeholder:text-[#9c8478] outline-none font-medium',
          }}
          className="toti-phone-input flex w-full items-center"
          countrySelectorStyleProps={{
            buttonClassName:
              '!border-0 !border-r !border-[#ead8ca] !rounded-l-xl !bg-[#fffaf6] hover:!bg-[#fff1e9] !px-3 !h-[46px] !transition-colors focus:!outline-none',
            dropdownStyleProps: {
              className:
                '!z-50 !rounded-xl !border !border-[#ead8ca] !bg-white !shadow-xl !max-h-60 !overflow-y-auto !py-1',
              listItemClassName:
                'hover:!bg-[#fff1e9] !text-xs !text-[#4b2417] !px-3 !py-2 !transition-colors',
            },
          }}
        />
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-[#8b7166]">{helperText}</p>
      ) : null}
    </div>
  );
};

export default InternationalPhoneInput;
