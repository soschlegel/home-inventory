import { api } from './client';
import type { ContainerType } from '../types';

export const getContainerTypes = () =>
  api.get<ContainerType[]>('/container-types').then((r) => r.data);

export const createContainerType = (data: { name: string; translations?: Record<string, string>; icon?: string; color?: string }) =>
  api.post<ContainerType>('/container-types', data).then((r) => r.data);

export const updateContainerType = (
  id: string,
  data: { name?: string; translations?: Record<string, string> | null; icon?: string; color?: string },
) => api.put<ContainerType>(`/container-types/${id}`, data).then((r) => r.data);

export const deleteContainerType = (id: string) => api.delete(`/container-types/${id}`);
