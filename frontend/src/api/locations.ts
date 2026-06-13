import { api } from './client';
import type { Location, Instance } from '../types';

export const getLocation = (id: string) =>
  api.get<Location>(`/locations/${id}`).then((r) => r.data);

export const updateLocation = (
  id: string,
  data: { name?: string; description?: string; containerTypeId?: string },
) => api.put<Location>(`/locations/${id}`, data).then((r) => r.data);

export const deleteLocation = (id: string) => api.delete(`/locations/${id}`);

export const getLocationInstances = (locationId: string) =>
  api.get<Instance[]>(`/locations/${locationId}/instances`).then((r) => r.data);

export const createInstance = (
  locationId: string,
  data: {
    productId?: string;
    name?: string;
    quantity?: number;
    unit?: string;
    tags?: string[];
  },
) => api.post<Instance>(`/locations/${locationId}/instances`, data).then((r) => r.data);
