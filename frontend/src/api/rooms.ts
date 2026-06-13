import { api } from './client';
import type { Room, Location } from '../types';

export const getRooms = () => api.get<Room[]>('/rooms').then((r) => r.data);

export const getRoom = (id: string) =>
  api.get<Room & { locations: Location[] }>(`/rooms/${id}`).then((r) => r.data);

export const getRoomsTree = () =>
  api.get<(Room & { locations: Location[]; _count: { locations: number } })[]>('/rooms/tree').then((r) => r.data);

export const createRoom = (data: { name: string; translations?: Record<string, string>; description?: string; icon?: string }) =>
  api.post<Room>('/rooms', data).then((r) => r.data);

export const updateRoom = (
  id: string,
  data: { name?: string; translations?: Record<string, string> | null; description?: string; icon?: string },
) => api.put<Room>(`/rooms/${id}`, data).then((r) => r.data);

export const deleteRoom = (id: string) => api.delete(`/rooms/${id}`);

export const getRoomLocations = (roomId: string) =>
  api.get<Location[]>(`/rooms/${roomId}/locations`).then((r) => r.data);

export const createLocation = (
  roomId: string,
  data: { name: string; description?: string; containerTypeId?: string; parentId?: string },
) => api.post<Location>(`/rooms/${roomId}/locations`, data).then((r) => r.data);
