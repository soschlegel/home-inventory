import { api } from './client';
import type { User } from '../types';

export const updateProfile = (data: {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}) => api.put<{ user: User }>('/auth/me', data).then((r) => r.data);
