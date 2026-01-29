export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  price?: number | null;
  stock: number;
  imageUrl?: string | null;
  isDefault: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt?: string | null;
  order: number;
  isPrimary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  category?: Category;
  imageUrl?: string | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id?: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  price_at_time: number;
  created_at: string;
}
