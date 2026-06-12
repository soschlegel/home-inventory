import { api } from './client';
import type { Location, Item } from '../types';

export const getLocation = (id: string) =>
  api.get<Location>(`/locations/${id}`).then((r) => r.data);

export const updateLocation = (
  id: string,
  data: { name?: string; description?: string; containerTypeId?: string },
) => api.put<Location>(`/locations/${id}`, data).then((r) => r.data);

export const deleteLocation = (id: string) => api.delete(`/locations/${id}`);

export const getLocationItems = (locationId: string) =>
  api.get<Item[]>(`/locations/${locationId}/items`).then((r) => r.data);

export const createItem = (
  locationId: string,
  data: {
    name: string;
    description?: string;
    quantity?: number;
    unit?: string;
    minQuantity?: number;
    condition?: string;
    purchaseUrl?: string;
    purchasePrice?: number;
    purchaseDate?: string;
    warrantyUntil?: string;
    serialNumber?: string;
    barcode?: string;
    tags?: string[];
  },
) => api.post<Item>(`/locations/${locationId}/items`, data).then((r) => r.data);
