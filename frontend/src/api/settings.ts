import { api } from './client';
import axios from 'axios';

export interface AppSettings {
  registration_enabled: boolean;
}

export const getSettings = () =>
  api.get<AppSettings>('/settings').then((r) => r.data);

export const getSettingsPublic = () =>
  axios.get<AppSettings>('/api/settings').then((r) => r.data);

export const updateSettings = (data: Partial<AppSettings>) =>
  api.put<AppSettings>('/settings', data).then((r) => r.data);
