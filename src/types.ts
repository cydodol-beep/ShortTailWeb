export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  postcode?: string | null;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku?: string | null;
  variant_image_url?: string | null;
  unit_label?: string | null;
  weight_grams?: number;
  price_adjustment: number;
  stock_quantity: number;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  category_id?: string;
  base_price: number;
  stock_quantity: number;
  main_image_url?: string;
  unit_weight_grams?: number;
  is_active?: boolean;
  status?: boolean | string | number;
  has_variants?: boolean;
  variants?: ProductVariant[];
  created_at?: string;
}

export interface CartItem {
  id: string; // `${product.id}-${selectedVariant?.id || 'base'}`
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
}

export interface Order {
  id?: string;
  custom_order_id?: string;
  source: string; // 'WebStore'
  status: string; // 'pending'
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_province?: string;
  recipient_city?: string;
  notes?: string;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  variant_name_snapshot?: string | null;
  quantity: number;
  price_at_purchase: number;
}

export type ResellerType = 'shorttail_brand' | 'white_label';

export interface ResellerRegistration {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province?: string;
  reseller_type: ResellerType;
  business_name?: string;
  notes?: string;
  created_at?: string;
}

