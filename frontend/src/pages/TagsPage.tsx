import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';
import { getTags, createTag, updateTag, deleteTag } from '../api/tags';
import type { Tag } from '../types';
import Spinner from '../components/Spinner';

function toKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[^a-z]+/, '')
    .replace(/_+$/, '');
}

export default function TagsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: tags, isLoading } = useQuery({ queryKey: ['tags'], queryFn: getTags });

  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');

  const createMut = useMutation({
    mutationFn: () => createTag({ key: newKey, name: newName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      setNewKey(''); setNewName(''); setShowForm(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const updateMut = useMutation({
    mutationFn: () => updateTag(editId!, { name: editName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      setEditId(null);
    },
  });

  const handleDelete = (tag: Tag) => {
    const count = tag._count?.items ?? 0;
    const msg = count > 0
      ? t('tags.confirm_delete_with_items', { name: tag.name, count })
      : t('tags.confirm_delete', { name: tag.name });
    if (confirm(msg)) deleteMut.mutate(tag.id);
  };

  const isValidKey = (k: string) => /^[a-z][a-z0-9_]*$/.test(k);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('tags.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('tags.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> {t('tags.add_btn')}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('tags.name_label')}</label>
              <input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newKey) setNewKey(toKey(e.target.value));
                }}
                placeholder={t('tags.name_placeholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('tags.key_label')}</label>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder={t('tags.key_placeholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">{t('tags.key_hint')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => createMut.mutate()}
              disabled={!newKey || !newName || !isValidKey(newKey) || createMut.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMut.isPending ? t('common.saving') : t('common.save')}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewKey(''); setNewName(''); }}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
          </div>
          {createMut.isError && (
            <p className="text-sm text-red-600">
              {(createMut.error as AxiosError<{ error: string }>)?.response?.data?.error ?? t('tags.error_duplicate')}
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {!tags?.length ? (
            <p className="py-8 text-center text-gray-400 text-sm">{t('tags.no_tags')}</p>
          ) : (
            tags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-3 px-4 py-3">
                {editId === tag.id ? (
                  <>
                    <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded flex-shrink-0">{tag.key}</span>
                    <input
                      aria-label={t('tags.name_label')}
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
                      aria-label={t('tags.save_label')}
                      onClick={() => updateMut.mutate()}
                      disabled={!editName || updateMut.isPending}
                      className="p-1.5 text-green-600 hover:text-green-700"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={t('tags.cancel_label')}
                      onClick={() => setEditId(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded flex-shrink-0">{tag.key}</span>
                    <span className="flex-1 font-medium text-gray-800 text-sm">{tag.name}</span>
                    {(tag._count?.items ?? 0) > 0 && (
                      <span className="text-xs text-gray-400">
                        {t('tags.items_count', { count: tag._count!.items })}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={t('tags.edit_label')}
                      onClick={() => { setEditId(tag.id); setEditName(tag.name); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={t('tags.delete_label')}
                      onClick={() => handleDelete(tag)}
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
