import { api } from './client';
import type { Lending } from '../types';

export const getActiveLendings = () =>
  api.get<Lending[]>('/lendings/active').then((r) => r.data);

export const getItemLendings = (itemId: string) =>
  api.get<Lending[]>(`/lendings/items/${itemId}/lendings`).then((r) => r.data);

export const lendItem = (
  itemId: string,
  data: { lentTo: string; lentAt?: string; note?: string },
) => api.post<Lending>(`/lendings/items/${itemId}/lend`, data).then((r) => r.data);

export const returnItem = (lendingId: string) =>
  api.put<Lending>(`/lendings/${lendingId}/return`).then((r) => r.data);
