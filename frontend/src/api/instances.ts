import { api } from './client';
import type { Instance, InstanceDocument, InstanceOverview, LowStockItem } from '../types';

export const getAllInstances = () => api.get<InstanceOverview[]>('/instances').then((r) => r.data);

export const createInstance = (data: { productId: string; locationId?: string | null; assignedUserId?: string | null; quantity?: number; purchaseUrl?: string }) =>
  api.post<Instance>('/instances', data).then((r) => r.data);

export const getInstance = (id: string) => api.get<Instance>(`/instances/${id}`).then((r) => r.data);

export const searchInstances = (q: string) =>
  api.get<InstanceOverview[]>('/instances/search', { params: { q } }).then((r) => r.data);

export const getLowStockInstances = () =>
  api.get<LowStockItem[]>('/instances/low-stock').then((r) => r.data);

export const getExpiringSoonInstances = () =>
  api.get<Instance[]>('/instances/expiring-soon').then((r) => r.data);

export const updateInstance = (id: string, data: Partial<Instance>) =>
  api.put<Instance>(`/instances/${id}`, data).then((r) => r.data);

export const deleteInstance = (id: string) => api.delete(`/instances/${id}`);

export const uploadInstanceDocument = (id: string, file: File) => {
  const form = new FormData();
  form.append('document', file);
  return api.post<InstanceDocument>(`/instances/${id}/documents`, form).then((r) => r.data);
};

export const deleteInstanceDocument = (instanceId: string, docId: string) =>
  api.delete(`/instances/${instanceId}/documents/${docId}`);

export const createLocationInstance = (
  locationId: string,
  data: { productId?: string; name?: string; quantity?: number; unit?: string; tags?: string[] },
) => api.post<Instance>(`/locations/${locationId}/instances`, data).then((r) => r.data);

export const getLocationInstances = (locationId: string) =>
  api.get<Instance[]>(`/locations/${locationId}/instances`).then((r) => r.data);
