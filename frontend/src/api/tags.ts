import { api } from './client';
import type { Tag } from '../types';

export const getTags = () => api.get<Tag[]>('/tags').then((r) => r.data);

export const createTag = (data: { key: string; name: string }) =>
  api.post<Tag>('/tags', data).then((r) => r.data);

export const updateTag = (id: string, data: Partial<{ key: string; name: string }>) =>
  api.put<Tag>(`/tags/${id}`, data).then((r) => r.data);

export const deleteTag = (id: string) => api.delete(`/tags/${id}`);
