import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getContainerTypes,
  createContainerType,
  updateContainerType,
  deleteContainerType,
} from '../api/containerTypes';
import Spinner from '../components/Spinner';

export default function ContainerTypesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: types, isLoading } = useQuery({
    queryKey: ['container-types'],
    queryFn: getContainerTypes,
  });

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');

  const createMut = useMutation({
    mutationFn: () => createContainerType({ name: newName, icon: newIcon || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['container-types'] });
      setNewName('');
      setNewIcon('');
      setShowForm(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteContainerType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['container-types'] }),
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const updateMut = useMutation({
    mutationFn: () => updateContainerType(editId!, { name: editName, icon: editIcon || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['container-types'] });
      setEditId(null);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('containerTypes.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('containerTypes.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> {t('containerTypes.add_btn')}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex gap-3">
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder={t('common.emoji_placeholder')}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('containerTypes.name_placeholder')}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => createMut.mutate()}
              disabled={!newName || createMut.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {!types?.length ? (
            <p className="py-8 text-center text-gray-400 text-sm">
              {t('containerTypes.no_types')}
            </p>
          ) : (
            types.map((ct) => (
              <div key={ct.id} className="flex items-center gap-3 px-4 py-3">
                {editId === ct.id ? (
                  <>
                    <input
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      placeholder={t('common.emoji_placeholder')}
                      className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    />
                    <input
                      aria-label={t('containerTypes.edit_name_label')}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm"
                    />
                    <button
                      type="button"
                      aria-label={t('containerTypes.save_label')}
                      onClick={() => updateMut.mutate()}
                      disabled={!editName}
                      className="p-1.5 text-green-600 hover:text-green-700"
                    >
                      <Check size={16} />
                    </button>
                    <button type="button" aria-label={t('containerTypes.cancel_label')} onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xl w-8">{ct.icon ?? '📦'}</span>
                    <span className="flex-1 font-medium text-gray-800 text-sm">{ct.name}</span>
                    <span className="text-xs text-gray-400">{t('common.container_count', { count: ct._count?.locations ?? 0 })}</span>
                    <button
                      type="button"
                      aria-label={t('containerTypes.edit_label')}
                      onClick={() => { setEditId(ct.id); setEditName(ct.name); setEditIcon(ct.icon ?? ''); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={t('containerTypes.delete_label')}
                      onClick={() => {
                        if (confirm(t('containerTypes.confirm_delete', { name: ct.name })))
                          deleteMut.mutate(ct.id);
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
