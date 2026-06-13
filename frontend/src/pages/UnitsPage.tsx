import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../api/units';
import Spinner from '../components/Spinner';

function toKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[^a-z]+/, '')
    .replace(/_+$/, '');
}

export default function UnitsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: units, isLoading } = useQuery({ queryKey: ['units'], queryFn: getUnits });

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');

  const createMut = useMutation({
    mutationFn: () => createUnit({ key: toKey(newName), name: newName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['units'] });
      setNewName(''); setShowForm(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteUnit,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['units'] }),
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const updateMut = useMutation({
    mutationFn: () => updateUnit(editId!, { name: editName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['units'] });
      setEditId(null);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('units.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('units.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> {t('units.add_btn')}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('units.name_label')}</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('units.name_placeholder')}
              onKeyDown={(e) => e.key === 'Enter' && newName && toKey(newName) && createMut.mutate()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => createMut.mutate()}
              disabled={!newName || !toKey(newName) || createMut.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMut.isPending ? t('common.saving') : t('common.save')}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewName(''); }}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
          </div>
          {createMut.isError && (
            <p className="mt-2 text-sm text-red-600">
              {(createMut.error as AxiosError<{ error: string }>)?.response?.data?.error ?? t('units.error_duplicate')}
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {!units?.length ? (
            <p className="py-8 text-center text-gray-400 text-sm">{t('units.no_units')}</p>
          ) : (
            units.map((unit) => (
              <div key={unit.id} className="flex items-center gap-3 px-4 py-3">
                {editId === unit.id ? (
                  <>
                    <input
                      aria-label={t('units.name_label')}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editName) updateMut.mutate();
                        if (e.key === 'Escape') setEditId(null);
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      aria-label={t('units.save_label')}
                      onClick={() => updateMut.mutate()}
                      disabled={!editName || updateMut.isPending}
                      className="p-1.5 text-green-600 hover:text-green-700"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={t('units.cancel_label')}
                      onClick={() => setEditId(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium text-gray-800 text-sm">{unit.name}</span>
                    <button
                      type="button"
                      aria-label={t('units.edit_label')}
                      onClick={() => { setEditId(unit.id); setEditName(unit.name); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={t('units.delete_label')}
                      onClick={() => {
                        if (confirm(t('units.confirm_delete', { name: unit.name })))
                          deleteMut.mutate(unit.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
