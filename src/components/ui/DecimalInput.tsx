import React, { useState, useEffect } from 'react';

export interface DecimalInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string | null | undefined;
  onChange: (value: number | null, rawText: string) => void;
  allowNegative?: boolean;
  maxDecimals?: number;
}

export const DecimalInput: React.FC<DecimalInputProps> = ({
  value,
  onChange,
  allowNegative = false,
  maxDecimals = 4,
  className = '',
  onFocus,
  placeholder = '0',
  ...props
}) => {
  const [text, setText] = useState<string>(() => {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
  });

  useEffect(() => {
    if (value === null || value === undefined || value === '') {
      if (text !== '') setText('');
      return;
    }

    const numericVal = Number(value);
    const normalizedText = text.replace(',', '.');
    const numericText =
      normalizedText === '' || normalizedText === '-' || normalizedText === '.'
        ? null
        : Number(normalizedText);

    // If numeric values match, keep the user's current text (preserves comma, trailing zeros, etc.)
    if (numericText !== null && !isNaN(numericText) && numericText === numericVal) {
      return;
    }

    setText(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Reject non-allowed characters (allow digits, one dot or comma, and optional leading minus)
    const validCharRegex = allowNegative ? /^[0-9.,-]*$/ : /^[0-9.,]*$/;
    if (!validCharRegex.test(raw)) return;

    // Check multiple minus signs or minus not at start
    if (raw.includes('-')) {
      if (!allowNegative) return;
      if (raw.indexOf('-') !== 0 || raw.lastIndexOf('-') !== 0) return;
    }

    // Check multiple decimal separators (dots or commas)
    const separatorsCount = (raw.match(/[.,]/g) || []).length;
    if (separatorsCount > 1) return;

    // Enforce max decimal places
    const separatorMatch = raw.match(/[.,]/);
    if (separatorMatch && separatorMatch.index !== undefined && maxDecimals !== undefined) {
      const fraction = raw.slice(separatorMatch.index + 1);
      if (fraction.length > maxDecimals) return;
    }

    // Strip redundant leading zeros (e.g., "05" -> "5", "-05" -> "-5", but preserve "0", "0.", "0,", "0.0")
    if (/^(-?)0\d/.test(raw)) {
      raw = raw.replace(/^(-?)0+/, '$1');
      if (raw === '' || raw === '-') raw = raw === '-' ? '-0' : '0';
    }

    setText(raw);

    // Call onChange with normalized numeric value and raw string
    const normalized = raw.replace(',', '.');
    if (normalized === '' || normalized === '-' || normalized === '.') {
      onChange(null, raw);
    } else {
      const parsed = parseFloat(normalized);
      onChange(isNaN(parsed) ? null : parsed, raw);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
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
