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

export function generateCustomOrderId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `WEB-${dateStr}-${randomSuffix}`;
}
