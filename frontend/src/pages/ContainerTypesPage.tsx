import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmojiPickerInput from '../components/EmojiPickerInput';
import {
  getContainerTypes,
  createContainerType,
  updateContainerType,
  deleteContainerType,
} from '../api/containerTypes';
import { locContainerTypeName } from '../utils/localizedName';
import Spinner from '../components/Spinner';

export default function ContainerTypesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: types, isLoading } = useQuery({
    queryKey: ['container-types'],
    queryFn: getContainerTypes,
  });

  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newNameDe, setNewNameDe] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newIcon, setNewIcon] = useState('');

  const createMut = useMutation({
    mutationFn: () =>
      createContainerType({
        key: newKey || undefined,
        name: newNameDe,
        nameDe: newNameDe || undefined,
        nameEn: newNameEn || undefined,
        icon: newIcon || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['container-types'] });
      setNewKey('');
      setNewNameDe('');
      setNewNameEn('');
      setNewIcon('');
      setShowForm(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteContainerType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['container-types'] }),
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editNameDe, setEditNameDe] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const updateMut = useMutation({
    mutationFn: () =>
      updateContainerType(editId!, {
        key: editKey || undefined,
        name: editNameDe,
        nameDe: editNameDe || undefined,
        nameEn: editNameEn || undefined,
        icon: editIcon || undefined,
      }),
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
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> {t('containerTypes.add_btn')}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex gap-3 flex-wrap">
            <EmojiPickerInput value={newIcon} onChange={setNewIcon} />
            <input
              aria-label={t('containerTypes.key_label')}
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder={t('containerTypes.key_placeholder')}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <div className="relative flex-1 min-w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇩🇪</span>
              <input
                aria-label={t('containerTypes.name_de_label')}
                value={newNameDe}
                onChange={(e) => setNewNameDe(e.target.value)}
                placeholder={t('containerTypes.name_de_placeholder')}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative flex-1 min-w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇬🇧</span>
              <input
                aria-label={t('containerTypes.name_en_label')}
                value={newNameEn}
                onChange={(e) => setNewNameEn(e.target.value)}
                placeholder={t('containerTypes.name_en_placeholder')}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={() => createMut.mutate()}
              disabled={!newNameDe || createMut.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 ml-1">{t('containerTypes.key_hint')}</p>
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
                    <EmojiPickerInput value={editIcon} onChange={setEditIcon} />
                    <input
                      aria-label={t('containerTypes.key_label')}
                      value={editKey}
                      onChange={(e) =>
                        setEditKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      }
                      placeholder={t('containerTypes.key_placeholder')}
                      className="w-28 border border-gray-300 rounded-lg px-3 py-1 text-sm font-mono"
                    />
                    <div className="relative flex-1 min-w-28">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm">🇩🇪</span>
                      <input
                        aria-label={t('containerTypes.name_de_label')}
                        value={editNameDe}
                        onChange={(e) => setEditNameDe(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="relative flex-1 min-w-28">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm">🇬🇧</span>
                      <input
                        aria-label={t('containerTypes.name_en_label')}
                        value={editNameEn}
                        onChange={(e) => setEditNameEn(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={t('containerTypes.save_label')}
                      onClick={() => updateMut.mutate()}
                      disabled={!editNameDe}
                      className="p-1.5 text-green-600 hover:text-green-700"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={t('containerTypes.cancel_label')}
                      onClick={() => setEditId(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xl w-8">{ct.icon ?? '📦'}</span>
                    <span className="flex-1 font-medium text-gray-800 text-sm">
                      {locContainerTypeName(t, ct)}
                      {ct.key && (
                        <span className="ml-2 text-xs text-gray-400 font-mono font-normal">
                          {ct.key}
                        </span>
                      )}
                    </span>
                    {(ct.nameDe || ct.nameEn) && (
                      <span className="text-xs text-gray-400">
                        {ct.nameDe && '🇩🇪'}{ct.nameEn && ' 🇬🇧'}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {t('common.container_count', { count: ct._count?.locations ?? 0 })}
                    </span>
                    <button
                      type="button"
                      aria-label={t('containerTypes.edit_label')}
                      onClick={() => {
                        setEditId(ct.id);
                        setEditKey(ct.key ?? '');
                        setEditNameDe(ct.nameDe ?? ct.name);
                        setEditNameEn(ct.nameEn ?? '');
                        setEditIcon(ct.icon ?? '');
                      }}
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
