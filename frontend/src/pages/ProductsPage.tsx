import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAllProducts, createProduct, deleteProduct } from '../api/products';
import { getTags } from '../api/tags';
import { useAuth } from '../contexts/AuthContext';
import { locTagName } from '../utils/localizedName';
import Spinner from '../components/Spinner';

export default function ProductsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isEditor = user?.role === 'EDITOR';

  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: getAllProducts });
  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: getTags });

  const createMut = useMutation({
    mutationFn: () => createProduct({ name: newName, barcode: newBarcode || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setNewName('');
      setNewBarcode('');
      setShowForm(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = (products ?? []).filter((p) => {
    const matchText = !filter || p.name.toLowerCase().includes(filter.toLowerCase()) ||
      (p.barcode ?? '').toLowerCase().includes(filter.toLowerCase());
    const matchTag = selectedTagIds.size === 0 ||
      p.tags?.some(({ tag }) => selectedTagIds.has(tag.id));
    return matchText && matchTag;
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('products.title')}</h1>
        {isEditor && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> {t('products.add_btn')}
          </button>
        )}
      </div>

      {isEditor && showForm && (
        <div className="mb-6 bg-white border border-indigo-300 rounded-xl p-4">
          <h2 className="font-medium text-gray-800 mb-3">{t('products.new_title')}</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              aria-label={t('common.name')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newName) createMut.mutate(); }}
              placeholder={t('products.name_placeholder')}
              className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <input
              aria-label={t('products.field_barcode')}
              value={newBarcode}
              onChange={(e) => setNewBarcode(e.target.value)}
              placeholder={t('products.field_barcode')}
              className="w-44 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => createMut.mutate()}
              disabled={!newName || createMut.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('common.save')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            aria-label={t('products.filter_placeholder')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('products.filter_placeholder')}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {allTags && allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const active = selectedTagIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {locTagName(t, tag)}{active && ' ✕'}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-xs text-gray-500">{filtered.length} {t('products.count', { count: filtered.length })}</p>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-gray-400 text-sm">
          {t('products.no_products')}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <div key={product.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-sm transition-all">
              <Link to={`/products/${product.id}`}>
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={32} className="text-gray-300" />
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium text-gray-900 text-sm leading-snug truncate">{product.name}</div>
                  {product.barcode && (
                    <div className="text-xs text-gray-400 mt-0.5 font-mono">{product.barcode}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {t('products.instances_count', { count: product._count?.instances ?? 0 })}
                  </div>
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {product.tags.slice(0, 2).map(({ tag }) => (
                        <span key={tag.id} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">
                          {t(`tagNames.${tag.key}`, { defaultValue: tag.name })}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
              {isEditor && (
                <div className="px-3 pb-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title={t('common.delete')}
                    onClick={() => {
                      if (confirm(t('products.confirm_delete', { name: product.name })))
                        deleteMut.mutate(product.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
