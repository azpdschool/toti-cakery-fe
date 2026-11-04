import React, { useState, useEffect } from 'react';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string | null | undefined;
  onChange: (value: number, rawDigits: string) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className = '',
  onFocus,
  placeholder = '0',
  ...props
}) => {
  const formatNumber = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || val === '') return '';
    const num = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''), 10);
    if (isNaN(num) || num === 0) return '';
    return num.toLocaleString('id-ID');
  };

  const [displayValue, setDisplayValue] = useState<string>(() => formatNumber(value));

  useEffect(() => {
    const currentNum = parseInt(displayValue.replace(/\D/g, ''), 10) || 0;
    const propNum =
      typeof value === 'number'
        ? value
        : parseInt(String(value || '').replace(/\D/g, ''), 10) || 0;

    if (currentNum !== propNum || (propNum === 0 && displayValue !== '')) {
      setDisplayValue(formatNumber(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setDisplayValue('');
      onChange(0, '');
      return;
    }
    const num = parseInt(raw, 10);
    setDisplayValue(num.toLocaleString('id-ID'));
    onChange(num, raw);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={(e) => {
        e.target.select();
        onFocus?.(e);
      }}
      placeholder={placeholder}
      className={`outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
      {...props}
    />
  );
};
