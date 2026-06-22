import { api } from './client';
import type { ProductGroup } from '../types';

export const getAllProductGroups = () =>
  api.get<ProductGroup[]>('/product-groups').then((r) => r.data);

export const getProductGroup = (id: string) =>
  api.get<ProductGroup>(`/product-groups/${id}`).then((r) => r.data);

export const createProductGroup = (data: { name: string; minQuantity?: number | null }) =>
  api.post<ProductGroup>('/product-groups', data).then((r) => r.data);

export const updateProductGroup = (id: string, data: Partial<{ name: string; minQuantity: number | null }>) =>
  api.put<ProductGroup>(`/product-groups/${id}`, data).then((r) => r.data);

export const deleteProductGroup = (id: string) =>
  api.delete(`/product-groups/${id}`);
