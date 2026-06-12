import { api } from './client';
import type { UserListEntry, UserRole } from '../types';

export const getUsers = () =>
  api.get<UserListEntry[]>('/users').then((r) => r.data);

export const createUser = (data: { email: string; password: string; name?: string; role: UserRole }) =>
  api.post<UserListEntry>('/users', data).then((r) => r.data);

export const updateUserRole = (id: string, role: UserRole) =>
  api.put<UserListEntry>(`/users/${id}/role`, { role }).then((r) => r.data);

export const deleteUser = (id: string) => api.delete(`/users/${id}`);
