// src/utils/phone.ts

/**
 * Helper utility to format and sanitize phone numbers into pure digits with country code (e.g., "6281299998888").
 *
 * Rules:
 * 1. Strips all non-digit characters (+, spaces, hyphens, parentheses, etc.).
 * 2. If the number starts with '0', converts '0' prefix to '62' (e.g., "08123456789" -> "628123456789").
 * 3. If the number already starts with '62', preserves it as '62' (e.g., "+62 812 9999 8888" -> "6281299998888").
 * 4. Handles edge cases like "+62 0812..." / "620812..." by stripping redundant leading zero after 62.
 *
 * @param phone Raw phone number string from input or state
 * @returns Cleaned phone number string in pure digit format
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''

  // 1. Remove all non-digit characters (+, spaces, dashes, etc.)
  let digits = phone.replace(/\D/g, '')
  if (!digits) return ''

  // 2. Normalize 08xx -> 628xx
  if (digits.startsWith('0')) {
    digits = '62' + digits.replace(/^0+/, '')
  } else if (digits.startsWith('620')) {
    // If entered +62 08xx resulting in 6208xx -> 628xx
    digits = '62' + digits.slice(2).replace(/^0+/, '')
  }

  return digits
}
