import { api } from './client';

export const exportData = async (): Promise<void> => {
  const response = await api.get('/admin/export', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  link.href = url;
  link.setAttribute('download', `home-inventory-backup-${date}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const importData = async (file: File): Promise<{ message: string; importedAt: string }> => {
  const text = await file.text();
  const json = JSON.parse(text) as unknown;
  return api.post<{ message: string; importedAt: string }>('/admin/import', json).then((r) => r.data);
};
