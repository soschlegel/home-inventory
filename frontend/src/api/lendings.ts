import { api } from './client';
import type { Lending } from '../types';

export const getActiveLendings = () =>
  api.get<Lending[]>('/lendings/active').then((r) => r.data);

export const getInstanceLendings = (instanceId: string) =>
  api.get<Lending[]>(`/lendings/instances/${instanceId}/lendings`).then((r) => r.data);

export const lendInstance = (
  instanceId: string,
  data: { lentTo: string; lentAt?: string; note?: string },
) => api.post<Lending>(`/lendings/instances/${instanceId}/lend`, data).then((r) => r.data);

export const returnItem = (lendingId: string) =>
  api.put<Lending>(`/lendings/${lendingId}/return`).then((r) => r.data);
