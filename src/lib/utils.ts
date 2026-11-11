// Utility helpers for ShortTail Web Store

import { Product } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getProductPriceDisplay(product: Product): string {
  if (product.has_variants && product.variants && product.variants.length > 0) {
    const prices = product.variants.map((v) => Number(v.price_adjustment));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      return formatRupiah(minPrice);
    }
    return `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`;
  }
  return formatRupiah(product.base_price);
}

export function getProductStockRangeDisplay(product: Product): string {
  if (product.has_variants && product.variants && product.variants.length > 0) {
    const stocks = product.variants.map((v) => Number(v.stock_quantity));
    const minStock = Math.min(...stocks);
    const maxStock = Math.max(...stocks);
    const totalStock = stocks.reduce((sum, s) => sum + s, 0);

    if (totalStock <= 0) return 'Stok Habis';
    if (minStock === maxStock) return `Stok: ${totalStock}`;
    return `Stok: ${minStock} - ${maxStock}`;
  }
  if (product.stock_quantity <= 0) return 'Stok Habis';
  return `Stok: ${product.stock_quantity}`;
}

export function getProductTotalStock(product: Product): number {
  if (product.has_variants && product.variants && product.variants.length > 0) {
    return product.variants.reduce((sum, v) => sum + Number(v.stock_quantity), 0);
  }
  return product.stock_quantity;
}

/**
 * Normalizes phone numbers to format '628...'
 * Converts '081234...' -> '6281234...'
 * Converts '81234...' -> '6281234...'
 * Strips spaces, dashes, plus signs
 */
export function normalizePhoneNumber(phoneInput: string): string {
  let cleaned = phoneInput.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62') && cleaned.length > 0) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function formatDisplayPhone(phone: string): string {
  if (!phone) return '';
  if (phone.startsWith('62')) {
    return '+62 ' + phone.slice(2, 5) + '-' + phone.slice(5, 9) + '-' + phone.slice(9);
  }
  return phone;
}

/**
 * PII Masking: Phone Number
 * Always preserves country code/first digits and last 3-4 digits, masking middle digits with '*'
 * Example: '+62 812-3456-7890' -> '+62 812-****-7890' or '0812-3456-7890' -> '0812-****-7890'
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const display = phone.startsWith('62') ? formatDisplayPhone(phone) : phone;

  if (display.includes('-')) {
    const parts = display.split('-');
    if (parts.length >= 3) {
      const middleMasked = '*'.repeat(parts[1].length || 4);
      return `${parts[0]}-${middleMasked}-${parts.slice(2).join('-')}`;
    }
  }

  const digitsOnly = display.replace(/[^0-9]/g, '');
  if (digitsOnly.length < 7) return display;

  const prefixLen = digitsOnly.startsWith('62') ? 5 : digitsOnly.startsWith('0') ? 4 : 3;
  const suffixLen = 4;
  if (digitsOnly.length > prefixLen + suffixLen) {
    const prefix = digitsOnly.slice(0, prefixLen);
    const suffix = digitsOnly.slice(-suffixLen);
    const maskedMiddle = '*'.repeat(digitsOnly.length - prefixLen - suffixLen);
    if (digitsOnly.startsWith('62')) {
      return `+${prefix.slice(0, 2)} ${prefix.slice(2)}-${maskedMiddle}-${suffix}`;
    }
    return `${prefix}-${maskedMiddle}-${suffix}`;
  }

  return display;
}

/**
 * PII Masking: Customer Name
 * Keeps first name initial/char, masking middle letters except alternating or ending
 * Example: "John Doe" -> "J*h* D**"
 */
export function maskName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return word;
      if (word.length === 2) return word[0] + '*';
      if (word.length === 3) return word[0] + '**';
      return word
        .split('')
        .map((char, index) => {
          if (index === 0) return char;
          if (index % 2 === 1) return '*';
          return char;
        })
        .join('');
    })
    .join(' ');
}

/**
 * PII Masking: Street Address
 * Keeps the first initial of each word, masking the rest of street address while keeping city and postal code visible.
 * Example: "Jl. Sudirman No. 12" -> "J*. S******* N*. 1*"
 */
export function maskAddress(address: string): string {
  if (!address) return '';
  return address
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return word;
      const match = word.match(/^(.+?)([,./\-]+)?$/);
      if (!match) return word;
      const core = match[1];
      const punct = match[2] || '';
      if (core.length <= 1) return word;

      const masked = core[0] + '*'.repeat(core.length - 1);
      return masked + punct;
    })
    .join(' ');
}

export function generateCustomOrderId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `WEB-${dateStr}-${randomSuffix}`;
}

export function isProductActive(product: { status?: boolean | string | number; is_active?: boolean }): boolean {
  if (product.is_active === false) return false;
  if (product.status === false) return false;
  if (product.status === 0) return false;
  if (typeof product.status === 'string') {
    const s = product.status.trim().toLowerCase();
    if (s === 'false' || s === 'inactive' || s === 'disabled' || s === '0') {
      return false;
    }
  }
  return true;
}

