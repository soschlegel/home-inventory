import { api } from './client';
import type { Unit } from '../types';

export const getUnits = () => api.get<Unit[]>('/units').then((r) => r.data);

export const createUnit = (data: { key: string; name: string }) =>
  api.post<Unit>('/units', data).then((r) => r.data);

export const updateUnit = (id: string, data: Partial<{ key: string; name: string }>) =>
  api.put<Unit>(`/units/${id}`, data).then((r) => r.data);

export const deleteUnit = (id: string) => api.delete(`/units/${id}`);
