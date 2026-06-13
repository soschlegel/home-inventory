import { useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import { Download, Upload, AlertTriangle, CheckCircle, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportData, importData } from '../api/admin';
import { getSettings, updateSettings } from '../api/settings';

export default function AdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  // --- Export ---
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // --- Import ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Settings ---
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const settingsMut = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await exportData();
    } catch {
      setExportError(t('admin.export_error'));
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setImportSuccess(false);
    setImportError(null);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    if (!confirm(t('admin.import_confirm'))) return;
    setImporting(true);
    setImportError(null);
    setImportSuccess(false);
    try {
      await importData(selectedFile);
      setImportSuccess(true);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      const msg = (err as AxiosError<{ error: string }>)?.response?.data?.error;
      setImportError(msg ?? t('admin.import_error'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('admin.subtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* Registrierung */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-gray-50 rounded-lg">
              <UserPlus size={20} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{t('admin.registration_title')}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{t('admin.registration_desc')}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={String(settings?.registration_enabled ?? true) as 'true' | 'false'}
                  aria-label={t('admin.registration_toggle_label')}
                  onClick={() =>
                    settingsMut.mutate({
                      registration_enabled: !(settings?.registration_enabled ?? true),
                    })
                  }
                  disabled={settingsMut.isPending}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
                    (settings?.registration_enabled ?? true) ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                      (settings?.registration_enabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {(settings?.registration_enabled ?? true)
                  ? t('admin.registration_on')
                  : t('admin.registration_off')}
              </p>
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Download size={20} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{t('admin.export_title')}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{t('admin.export_desc')}</p>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="mt-3 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Download size={15} />
                {exporting ? t('admin.exporting') : t('admin.export_btn')}
              </button>
              {exportError && <p className="mt-2 text-sm text-red-600">{exportError}</p>}
            </div>
          </div>
        </div>

        {/* Import */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Upload size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{t('admin.import_title')}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{t('admin.import_desc')}</p>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload size={14} className="text-gray-500" />
                  {selectedFile ? selectedFile.name : t('admin.import_choose')}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importing}
                    className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    <Upload size={14} />
                    {importing ? t('admin.importing') : t('admin.import_btn')}
                  </button>
                )}
              </div>

              <div className="mt-3 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                <span>{t('admin.import_warning')}</span>
              </div>

              {importSuccess && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle size={15} />
                  {t('admin.import_success')}
                </div>
              )}
              {importError && <p className="mt-2 text-sm text-red-600">{importError}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
