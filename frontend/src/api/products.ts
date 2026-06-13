import { api } from './client';
import type { Product, ProductDocument } from '../types';

export const getAllProducts = () => api.get<Product[]>('/products').then((r) => r.data);

export const getProduct = (id: string) => api.get<Product>(`/products/${id}`).then((r) => r.data);

export const searchProducts = (q: string) =>
  api.get<Product[]>('/products/search', { params: { q } }).then((r) => r.data);

export const createProduct = (data: { name: string; description?: string; barcode?: string; tags?: string[] }) =>
  api.post<Product>('/products', data).then((r) => r.data);

export const updateProduct = (id: string, data: Partial<{ name: string; description: string; barcode: string; purchaseUrl: string; minQuantity: number | null; expiryWarningDays: number | null; tags: string[] }>) =>
  api.put<Product>(`/products/${id}`, data).then((r) => r.data);

export const deleteProduct = (id: string) => api.delete(`/products/${id}`);

export const uploadProductImage = (id: string, file: File) => {
  const form = new FormData();
  form.append('image', file);
  return api.post<Product>(`/products/${id}/image`, form).then((r) => r.data);
};

export const uploadProductDocument = (id: string, file: File) => {
  const form = new FormData();
  form.append('document', file);
  return api.post<ProductDocument>(`/products/${id}/documents`, form).then((r) => r.data);
};

export const deleteProductDocument = (productId: string, docId: string) =>
  api.delete(`/products/${productId}/documents/${docId}`);
