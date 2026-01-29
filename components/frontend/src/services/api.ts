import { Product, Category } from "../types/types";
import { CartItem } from '@/contexts/CartContext'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// #region agent log
fetch('http://127.0.0.1:7245/ingest/32e45304-f290-4da1-a9b1-66cfaf4392ac', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'debug-session',
    runId: 'pre-fix',
    hypothesisId: 'H1',
    location: 'services/api.ts:API_BASE_URL',
    message: 'API base URL at module load',
    data: { API_BASE_URL },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

export type ProductFormData = {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId: string;
  images?: string[];
  variants?: Array<{
    sku?: string;
    size?: string;
    color?: string;
    material?: string;
    price?: number;
    stock: number;
    imageUrl?: string;
    isDefault?: boolean;
  }>;
};

type GetProductsParams = {
  search?: string;
  category?: string; 
};

export interface OrderPayload {
  clientInfo: {
    name: string;
    phone: string;
    address: string;
  };
  cartItems: Array<{
    id: string;
    quantity: number;
    price: number;
    variantId?: string;
  }>;
}


export const getProducts = async (params: GetProductsParams = {}): Promise<Product[]> => {
  const queryParams = new URLSearchParams();

  if (params.search) {
    queryParams.append('q', params.search);
  }
  if (params.category) {
    queryParams.append('category', params.category);
  }

  const queryString = queryParams.toString();

  const requestUrl = `${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`;

  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/32e45304-f290-4da1-a9b1-66cfaf4392ac', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H1',
      location: 'services/api.ts:getProducts',
      message: 'Fetching products',
      data: { requestUrl, params },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const response = await fetch(requestUrl);
  if (!response.ok) throw new Error('Failed to fetch products');

  const products: Product[] = await response.json();
  return products.map((product: any) => ({
    ...product,
    price: parseFloat(product.price as any),
    variants: Array.isArray(product.variants)
      ? product.variants.map((v: any) => ({
          ...v,
          price: v.price == null ? v.price : parseFloat(v.price as any),
        }))
      : undefined,
  }));
};



export const getCategories = async (): Promise<Category[]> => {
  const requestUrl = `${API_BASE_URL}/categories`;

  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/32e45304-f290-4da1-a9b1-66cfaf4392ac', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H1',
      location: 'services/api.ts:getCategories',
      message: 'Fetching categories',
      data: { requestUrl },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
};



export const createProduct = async (productData: ProductFormData): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!response.ok) throw new Error('Failed to create product');
  return response.json();
};

export const updateProduct = async ({ id, data }: { id: string; data: Partial<ProductFormData> }): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update product');
  return response.json();
};

export const deleteProduct = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete product');
};


export const createOrder = async (orderData: OrderPayload) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create order');
  }

  return response.json();
};