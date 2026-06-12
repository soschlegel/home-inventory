import { api } from './client';
import type { Item } from '../types';

export const getItem = (id: string) => api.get<Item>(`/items/${id}`).then((r) => r.data);

export const searchItems = (q: string) =>
  api.get<Item[]>('/items/search', { params: { q } }).then((r) => r.data);

export const getLowStockItems = () =>
  api.get<Item[]>('/items/low-stock').then((r) => r.data);

export const updateItem = (id: string, data: Partial<Item> & { tags?: string[] }) =>
  api.put<Item>(`/items/${id}`, data).then((r) => r.data);

export const deleteItem = (id: string) => api.delete(`/items/${id}`);

export const uploadItemImage = (id: string, file: File) => {
  const form = new FormData();
  form.append('image', file);
  return api.post<Item>(`/items/${id}/image`, form).then((r) => r.data);
};
