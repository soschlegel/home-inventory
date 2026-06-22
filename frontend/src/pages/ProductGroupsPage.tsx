import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllProductGroups,
  createProductGroup,
  updateProductGroup,
  deleteProductGroup,
} from '../api/product-groups';
import Spinner from '../components/Spinner';

export default function ProductGroupsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isEditor = user?.role === 'EDITOR';
  const qc = useQueryClient();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['product-groups'],
    queryFn: getAllProductGroups,
  });

  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addMinQty, setAddMinQty] = useState('');

  const createMut = useMutation({
    mutationFn: () => createProductGroup({ name: addName, minQuantity: addMinQty ? parseFloat(addMinQty) : null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-groups'] });
      setAddName(''); setAddMinQty(''); setShowAdd(false);
    },
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMinQty, setEditMinQty] = useState('');

  function startEdit(id: string, name: string, minQty: number | null | undefined) {
    setEditId(id);
    setEditName(name);
    setEditMinQty(minQty != null ? String(minQty) : '');
  }

  const updateMut = useMutation({
    mutationFn: () => updateProductGroup(editId!, { name: editName, minQuantity: editMinQty ? parseFloat(editMinQty) : null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-groups'] });
      setEditId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProductGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-groups'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('productGroups.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('productGroups.subtitle')}</p>
        </div>
        {isEditor && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={16} /> {t('productGroups.add_btn')}
          </button>
        )}
      </div>

      {showAdd && isEditor && (
        <div className="bg-white border border-indigo-200 rounded-xl p-4 mb-4 space-y-3">
          <h2 className="font-medium text-gray-800">{t('productGroups.new_title')}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="label-wrap">
              <span className="label">{t('common.name')}</span>
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="input"
                placeholder={t('productGroups.name_placeholder')}
              />
            </label>
            <label className="label-wrap">
              <span className="label">{t('productGroups.field_min_quantity')}</span>
              <input
                type="number"
                min="0"
                value={addMinQty}
                onChange={(e) => setAddMinQty(e.target.value)}
                className="input"
                placeholder="z.B. 2"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => createMut.mutate()}
              disabled={!addName || createMut.isPending}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              <Check size={14} /> {createMut.isPending ? t('common.saving') : t('common.save')}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {groups?.length === 0 && (
        <p className="text-gray-500 text-sm">{t('productGroups.no_groups')}</p>
      )}

      <div className="space-y-2">
        {groups?.map((group) => (
          <div key={group.id} className="bg-white border border-gray-200 rounded-xl p-4">
            {editId === group.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="label-wrap">
                    <span className="label">{t('common.name')}</span>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input" />
                  </label>
                  <label className="label-wrap">
                    <span className="label">{t('productGroups.field_min_quantity')}</span>
                    <input type="number" min="0" value={editMinQty} onChange={(e) => setEditMinQty(e.target.value)} className="input" />
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateMut.mutate()}
                    disabled={!editName || updateMut.isPending}
                    className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Check size={13} /> {t('common.save')}
                  </button>
                  <button type="button" onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-2 rounded-lg"><Layers size={18} className="text-indigo-500" /></div>
                  <div>
                    <div className="font-medium text-gray-900">{group.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {group.minQuantity != null && (
                        <span className="mr-3">min. {group.minQuantity}</span>
                      )}
                      <span>{t('productGroups.products_count', { count: group._count?.products ?? 0 })}</span>
                    </div>
                  </div>
                </div>
                {isEditor && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(group.id, group.name, group.minQuantity)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"
                      title={t('common.edit')}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t('productGroups.confirm_delete', { name: group.name }))) {
                          deleteMut.mutate(group.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                      title={t('common.delete')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {(group.products?.length ?? 0) > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                {group.products?.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 px-2.5 py-1 rounded-full transition-colors"
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
