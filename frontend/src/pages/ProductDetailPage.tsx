import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Upload, Pencil, X, Check, FileText, Trash2, Package, Plus, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getProduct, updateProduct, deleteProduct, uploadProductImage, uploadProductDocument, deleteProductDocument } from '../api/products';
import { getTags } from '../api/tags';
import { getRooms, getRoom } from '../api/rooms';
import { createInstance } from '../api/instances';
import { getUnits } from '../api/units';
import { useAuth } from '../contexts/AuthContext';
import { CONDITION_COLORS } from '../types';
import type { ItemCondition, Location } from '../types';
import Spinner from '../components/Spinner';

function flattenLocations(locations: Location[], prefix = ''): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = [];
  for (const loc of locations) {
    result.push({ id: loc.id, label: prefix + loc.name });
    if (loc.children?.length) {
      result.push(...flattenLocations(loc.children, prefix + loc.name + ' › '));
    }
  }
  return result;
}

export default function ProductDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditor = user?.role === 'EDITOR';

  const { data: product, isLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id!),
  });
  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: getTags });
  const { data: units } = useQuery({ queryKey: ['units'], queryFn: getUnits });

  // ── Add Instance form ────────────────────────────────────────────────
  const [showAddInstance, setShowAddInstance] = useState(false);
  const [addRoomId, setAddRoomId] = useState('');
  const [addLocationId, setAddLocationId] = useState('');
  const [addQty, setAddQty] = useState('1');
  const [addUnit, setAddUnit] = useState('');

  const { data: allRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
    enabled: showAddInstance,
  });
  const { data: addRoom } = useQuery({
    queryKey: ['room', addRoomId],
    queryFn: () => getRoom(addRoomId),
    enabled: !!addRoomId,
  });
  const addLocations = addRoom ? flattenLocations(addRoom.locations ?? []) : [];

  const addInstanceMut = useMutation({
    mutationFn: () =>
      createInstance({
        productId: id!,
        locationId: addLocationId || null,
        quantity: parseFloat(addQty) || 1,
        unit: addUnit || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', id] });
      setShowAddInstance(false);
      setAddRoomId('');
      setAddLocationId('');
      setAddQty('1');
      setAddUnit('');
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editPurchaseUrl, setEditPurchaseUrl] = useState('');
  const [editMinQty, setEditMinQty] = useState('');
  const [editExpiryWarningDays, setEditExpiryWarningDays] = useState('');
  const [editTagKeys, setEditTagKeys] = useState<string[]>([]);

  function startEditing() {
    if (!product) return;
    setEditName(product.name);
    setEditDescription(product.description ?? '');
    setEditBarcode(product.barcode ?? '');
    setEditPurchaseUrl(product.purchaseUrl ?? '');
    setEditMinQty(product.minQuantity != null ? String(product.minQuantity) : '');
    setEditExpiryWarningDays(product.expiryWarningDays != null ? String(product.expiryWarningDays) : '');
    setEditTagKeys(product.tags?.map(({ tag }) => tag.key) ?? []);
    setIsEditing(true);
  }

  const updateMut = useMutation({
    mutationFn: () => updateProduct(id!, {
      name: editName,
      description: editDescription || undefined,
      barcode: editBarcode || undefined,
      purchaseUrl: editPurchaseUrl || '',
      minQuantity: editMinQty ? parseFloat(editMinQty) : null,
      expiryWarningDays: editExpiryWarningDays ? parseInt(editExpiryWarningDays) : null,
      tags: editTagKeys,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', id] });
      setIsEditing(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteProduct(id!),
    onSuccess: () => navigate('/products'),
  });

  const uploadImageMut = useMutation({
    mutationFn: (file: File) => uploadProductImage(id!, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', id] }),
  });

  const uploadDocMut = useMutation({
    mutationFn: (file: File) => uploadProductDocument(id!, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', id] }),
  });

  const deleteDocMut = useMutation({
    mutationFn: (docId: string) => deleteProductDocument(id!, docId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', id] }),
  });

  if (isLoading) return <Spinner />;
  if (!product) return <p className="text-gray-500">{t('products.not_found')}</p>;

  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 flex-wrap">
        <Link to="/products" className="hover:text-indigo-600">{t('nav.products')}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bild */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover" />
            ) : (
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-5xl">📦</div>
            )}
            {isEditor && (
              <label className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer border-t border-gray-200">
                <Upload size={15} />
                {product.imageUrl ? t('item.image_replace') : t('item.image_upload')}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImageMut.mutate(e.target.files[0])}
                />
              </label>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          {isEditing ? (
            <div className="bg-white border border-indigo-300 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{t('products.edit_title')}</h2>
                <button type="button" onClick={() => setIsEditing(false)} aria-label={t('common.cancel')} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2 label-wrap">
                  <span className="label">{t('common.name')}</span>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input" />
                </label>
                <label className="sm:col-span-2 label-wrap">
                  <span className="label">{t('common.description')}</span>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} className="input" />
                </label>
                <label className="label-wrap">
                  <span className="label">{t('products.field_barcode')}</span>
                  <input value={editBarcode} onChange={(e) => setEditBarcode(e.target.value)} className="input" placeholder="EAN / ISBN …" />
                </label>
                <label className="label-wrap">
                  <span className="label">{t('products.field_min_quantity')}</span>
                  <input type="number" min="0" step="0.1" value={editMinQty} onChange={(e) => setEditMinQty(e.target.value)} placeholder="–" className="input" />
                </label>
                <label className="label-wrap">
                  <span className="label">{t('products.field_expiry_warning_days')}</span>
                  <input type="number" min="1" step="1" value={editExpiryWarningDays} onChange={(e) => setEditExpiryWarningDays(e.target.value)} placeholder="30" className="input" />
                </label>
                <label className="sm:col-span-2 label-wrap">
                  <span className="label">{t('products.field_purchase_url')}</span>
                  <input type="url" value={editPurchaseUrl} onChange={(e) => setEditPurchaseUrl(e.target.value)} placeholder="https://…" className="input" />
                </label>
              </div>
              {allTags && allTags.length > 0 && (
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wide mb-2">{t('item.field_tags')}</span>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                      const sel = editTagKeys.includes(tag.key);
                      return (
                        <button
                          key={tag.key}
                          type="button"
                          onClick={() => setEditTagKeys((p) => sel ? p.filter((k) => k !== tag.key) : [...p, tag.key])}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sel ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}
                        >
                          {t(`tagNames.${tag.key}`, { defaultValue: tag.name })}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => updateMut.mutate()}
                  disabled={!editName || updateMut.isPending}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Check size={15} /> {updateMut.isPending ? t('common.saving') : t('common.save')}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
                  {product.description && <p className="text-gray-600 text-sm mt-1">{product.description}</p>}
                  {product.barcode && (
                    <p className="text-xs text-gray-400 font-mono mt-1">EAN: {product.barcode}</p>
                  )}
                  {product.minQuantity != null && (
                    <p className="text-xs text-gray-500 mt-1">{t('products.field_min_quantity')}: {product.minQuantity}</p>
                  )}
                  {product.expiryWarningDays != null && (
                    <p className="text-xs text-gray-500 mt-1">{t('products.field_expiry_warning_days')}: {product.expiryWarningDays} d</p>
                  )}
                  {product.purchaseUrl && (
                    <a href={product.purchaseUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1">
                      <ExternalLink size={11} /> {t('products.field_purchase_url')}
                    </a>
                  )}
                </div>
                {isEditor && (
                  <button type="button" onClick={startEditing} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors" title={t('common.edit')}>
                    <Pencil size={15} />
                  </button>
                )}
              </div>
              {product.tags && product.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {product.tags.map(({ tag }) => (
                    <span key={tag.id} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full">
                      {t(`tagNames.${tag.key}`, { defaultValue: tag.name })}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dokumente (Stammdaten) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-gray-800 flex items-center gap-2">
                <FileText size={16} /> {t('products.documents_section')}
              </h2>
              {isEditor && (
                <label className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer">
                  <Upload size={14} /> {t('item.documents_upload')}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadDocMut.mutate(e.target.files[0])}
                  />
                </label>
              )}
            </div>
            {!product.documents?.length ? (
              <p className="text-sm text-gray-400">{t('products.documents_empty')}</p>
            ) : (
              <div className="space-y-2">
                {product.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-xl flex-shrink-0">{doc.mimeType === 'application/pdf' ? '📄' : '🖼️'}</span>
                    <div className="flex-1 min-w-0">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 hover:underline truncate block">
                        {doc.originalName}
                      </a>
                      {doc.size && (
                        <span className="text-xs text-gray-400">
                          {doc.size < 1024 * 1024 ? `${(doc.size / 1024).toFixed(0)} KB` : `${(doc.size / 1024 / 1024).toFixed(1)} MB`}
                        </span>
                      )}
                    </div>
                    {isEditor && (
                      <button
                        type="button"
                        title={t('common.delete')}
                        onClick={() => { if (confirm(t('item.documents_delete_confirm'))) deleteDocMut.mutate(doc.id); }}
                        className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instanzen */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-gray-800 flex items-center gap-2">
                <Package size={16} /> {t('products.instances_section')}
              </h2>
              {isEditor && (
                <button
                  type="button"
                  onClick={() => setShowAddInstance(!showAddInstance)}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Plus size={14} /> {t('products.add_instance_btn')}
                </button>
              )}
            </div>

            {/* Add Instance form */}
            {isEditor && showAddInstance && (
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
                <h3 className="text-sm font-medium text-indigo-900">{t('products.add_instance_title')}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="label-wrap">
                    <span className="label">{t('instance.move_room_label')}</span>
                    <select
                      value={addRoomId}
                      onChange={(e) => { setAddRoomId(e.target.value); setAddLocationId(''); }}
                      className="input"
                      aria-label={t('instance.move_room_label')}
                    >
                      <option value="">{t('instance.move_select_room')}</option>
                      {allRooms?.map((r) => (
                        <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="label-wrap">
                    <span className="label">{t('instance.move_container_label')}</span>
                    <select
                      value={addLocationId}
                      onChange={(e) => setAddLocationId(e.target.value)}
                      disabled={!addRoomId}
                      className="input disabled:opacity-50"
                      aria-label={t('instance.move_container_label')}
                    >
                      <option value="">{t('instance.move_select_container')}</option>
                      {addLocations.map((l) => (
                        <option key={l.id} value={l.id}>{l.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="label-wrap">
                    <span className="label">{t('instance.field_quantity')}</span>
                    <input
                      type="number" min="0.1" step="0.1"
                      value={addQty}
                      onChange={(e) => setAddQty(e.target.value)}
                      className="input"
                    />
                  </label>
                  <label className="label-wrap">
                    <span className="label">{t('instance.field_unit')}</span>
                    <select value={addUnit} onChange={(e) => setAddUnit(e.target.value)} className="input" aria-label={t('instance.field_unit')}>
                      <option value="">{t('location.unit_placeholder')}</option>
                      {units?.map((u) => (
                        <option key={u.id} value={u.key}>{t(`unitNames.${u.key}`, { defaultValue: u.name })}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addInstanceMut.mutate()}
                    disabled={addInstanceMut.isPending}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Check size={14} /> {addInstanceMut.isPending ? t('common.saving') : t('common.save')}
                  </button>
                  <button type="button" onClick={() => setShowAddInstance(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {!product.instances?.length ? (
              <p className="text-sm text-gray-400">{t('products.no_instances')}</p>
            ) : (
              <div className="space-y-2">
                {product.instances.map((inst) => {
                  const isLent = inst.lendings && inst.lendings.length > 0;
                  return (
                    <Link
                      key={inst.id}
                      to={`/instances/${inst.id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800">
                          {inst.location
                            ? `${inst.location.room?.name ?? ''} › ${inst.location.name}`
                            : inst.assignedUser
                            ? `👤 ${inst.assignedUser.name ?? inst.assignedUser.email}`
                            : t('products.instance_no_location')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {inst.quantity}{inst.unit ? ` ${inst.unit}` : ''}
                          {inst.serialNumber && ` · SN: ${inst.serialNumber}`}
                          {isLent && ` · 🔄 ${t('location.lent_badge')}`}
                        </div>
                      </div>
                      {inst.condition && (
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${CONDITION_COLORS[inst.condition as ItemCondition]}`}>
                          {t(`condition.${inst.condition}`)}
                        </span>
                      )}
                      <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Löschen */}
          {isEditor && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (confirm(t('products.confirm_delete', { name: product.name }))) deleteMut.mutate();
                }}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 size={15} /> {t('products.delete_btn')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
