import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ExternalLink, Trash2, Upload, ArrowRightLeft, Pencil, X, Check, MoveRight, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getItem, updateItem, deleteItem, uploadItemImage, uploadItemDocument, deleteItemDocument } from '../api/items';
import { lendItem, returnItem } from '../api/lendings';
import { getUnits } from '../api/units';
import { getTags } from '../api/tags';
import { getRooms, getRoom } from '../api/rooms';
import { useAuth } from '../contexts/AuthContext';
import type { ItemCondition, Location } from '../types';
import { CONDITION_COLORS } from '../types';
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

export default function ItemDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditor = user?.role === 'EDITOR';

  const { data: item, isLoading } = useQuery({
    queryKey: ['items', id],
    queryFn: () => getItem(id!),
  });
  const { data: units } = useQuery({ queryKey: ['units'], queryFn: getUnits });
  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: getTags });

  // ── Edit state ──────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editMinQty, setEditMinQty] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editPurchaseUrl, setEditPurchaseUrl] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState('');
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [editWarrantyUntil, setEditWarrantyUntil] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editExpiryWarningDays, setEditExpiryWarningDays] = useState('');
  const [editTagKeys, setEditTagKeys] = useState<string[]>([]);

  function startEditing() {
    if (!item) return;
    setEditName(item.name);
    setEditDescription(item.description ?? '');
    setEditQuantity(String(item.quantity));
    setEditUnit(item.unit ?? '');
    setEditMinQty(item.minQuantity != null ? String(item.minQuantity) : '');
    setEditCondition(item.condition ?? '');
    setEditSerialNumber(item.serialNumber ?? '');
    setEditBarcode(item.barcode ?? '');
    setEditPurchaseUrl(item.purchaseUrl ?? '');
    setEditPurchasePrice(item.purchasePrice != null ? String(item.purchasePrice) : '');
    setEditPurchaseDate(item.purchaseDate ? item.purchaseDate.slice(0, 10) : '');
    setEditWarrantyUntil(item.warrantyUntil ? item.warrantyUntil.slice(0, 10) : '');
    setEditExpiryDate(item.expiryDate ? item.expiryDate.slice(0, 10) : '');
    setEditExpiryWarningDays(item.expiryWarningDays != null ? String(item.expiryWarningDays) : '');
    setEditTagKeys(item.tags?.map(({ tag }) => tag.key) ?? []);
    setIsEditing(true);
  }

  function toggleTag(key: string) {
    setEditTagKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  const updateMut = useMutation({
    mutationFn: () => updateItem(id!, {
      name: editName,
      description: editDescription || undefined,
      quantity: parseFloat(editQuantity) || 1,
      unit: editUnit || undefined,
      minQuantity: editMinQty ? parseFloat(editMinQty) : undefined,
      condition: (editCondition as ItemCondition) || undefined,
      serialNumber: editSerialNumber || undefined,
      barcode: editBarcode || undefined,
      purchaseUrl: editPurchaseUrl || undefined,
      purchasePrice: editPurchasePrice ? parseFloat(editPurchasePrice) : undefined,
      purchaseDate: editPurchaseDate || undefined,
      warrantyUntil: editWarrantyUntil || undefined,
      expiryDate: editExpiryDate || undefined,
      expiryWarningDays: editExpiryWarningDays ? parseInt(editExpiryWarningDays) : undefined,
      tags: editTagKeys,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', id] });
      setIsEditing(false);
    },
  });

  // ── Move state ──────────────────────────────────────────────────────
  const [showMove, setShowMove] = useState(false);
  const [moveRoomId, setMoveRoomId] = useState('');
  const [moveLocationId, setMoveLocationId] = useState('');

  const { data: allRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
    enabled: showMove,
  });

  const { data: moveRoom } = useQuery({
    queryKey: ['room', moveRoomId],
    queryFn: () => getRoom(moveRoomId),
    enabled: !!moveRoomId,
  });

  const moveLocations = moveRoom ? flattenLocations(moveRoom.locations ?? []) : [];

  const moveMut = useMutation({
    mutationFn: () => updateItem(id!, { locationId: moveLocationId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', id] });
      qc.invalidateQueries({ queryKey: ['items-overview'] });
      setShowMove(false);
      setMoveRoomId('');
      setMoveLocationId('');
    },
  });

  function openMove() {
    setMoveRoomId(item?.location?.room?.id ?? '');
    setMoveLocationId(item?.locationId ?? '');
    setShowMove(true);
  }

  // ── Lending state ───────────────────────────────────────────────────
  const [showLendForm, setShowLendForm] = useState(false);
  const [lentTo, setLentTo] = useState('');
  const [lentNote, setLentNote] = useState('');

  const lendMut = useMutation({
    mutationFn: () => lendItem(id!, { lentTo, note: lentNote || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', id] });
      qc.invalidateQueries({ queryKey: ['lendings'] });
      setLentTo(''); setLentNote(''); setShowLendForm(false);
    },
  });

  const returnMut = useMutation({
    mutationFn: (lendingId: string) => returnItem(lendingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', id] });
      qc.invalidateQueries({ queryKey: ['lendings'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteItem(id!),
    onSuccess: () => navigate(`/locations/${item?.locationId}`),
  });

  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadItemImage(id!, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', id] }),
  });

  const uploadDocMut = useMutation({
    mutationFn: (file: File) => uploadItemDocument(id!, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', id] }),
  });

  const deleteDocMut = useMutation({
    mutationFn: (docId: string) => deleteItemDocument(id!, docId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', id] }),
  });

  if (isLoading) return <Spinner />;
  if (!item) return <p className="text-gray-500">{t('item.not_found')}</p>;

  const activeLending = item.lendings?.find((l) => !l.returnedAt);
  const fmt = (date?: string | null) =>
    date ? new Date(date).toLocaleDateString(i18n.language) : '–';

  const expiryStatus = (expiryDate?: string | null, warningDays?: number | null) => {
    if (!expiryDate) return null;
    const now = new Date();
    const exp = new Date(expiryDate);
    const days = warningDays ?? 30;
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    if (exp < now) return 'expired' as const;
    if (exp <= threshold) return 'warning' as const;
    return 'ok' as const;
  };

  const unitLabel = (key?: string | null) =>
    key ? t(`unitNames.${key}`, { defaultValue: key }) : '';

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 flex-wrap">
        <Link to="/rooms" className="hover:text-indigo-600">{t('nav.rooms')}</Link>
        <ChevronRight size={14} />
        <Link to={`/rooms/${item.location?.room?.id}`} className="hover:text-indigo-600">
          {item.location?.room?.name}
        </Link>
        <ChevronRight size={14} />
        <Link to={`/locations/${item.locationId}`} className="hover:text-indigo-600">
          {item.location?.name}
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{item.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bild */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full aspect-square object-cover" />
            ) : (
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-5xl">📦</div>
            )}
            {isEditor && (
              <label className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer border-t border-gray-200">
                <Upload size={15} />
                {item.imageUrl ? t('item.image_replace') : t('item.image_upload')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadMut.mutate(e.target.files[0])}
                />
              </label>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">

          {isEditing ? (
            /* ── Edit-Formular ────────────────────────────────────────── */
            <div className="bg-white border border-indigo-300 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{t('item.edit_title')}</h2>
                <button type="button" onClick={() => setIsEditing(false)} aria-label={t('item.close_edit_label')} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2 label-wrap">
                  <span className="label">{t('item.field_name')}</span>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input" />
                </label>
                <label className="sm:col-span-2 label-wrap">
                  <span className="label">{t('item.field_description')}</span>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} className="input" />
                </label>
                <label className="label-wrap">
                  <span className="label">{t('item.field_quantity')}</span>
                  <input type="number" min="0" step="0.1" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="input" />
                </label>
                <label className="label-wrap">
                  <span className="label">{t('item.field_unit')}</span>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="input"
                    aria-label={t('item.field_unit')}
                  >
                    <option value="">{t('item.tags_none')}</option>
                    {units?.map((u) => (
                      <option key={u.id} value={u.key}>
                        {t(`unitNames.${u.key}`, { defaultValue: u.name })}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label-wrap">
                  <span className="label">{t('item.field_min_quantity')}</span>
                  <input type="number" min="0" step="0.1" value={editMinQty} onChange={(e) => setEditMinQty(e.target.value)} placeholder="–" className="input" />
                </label>
                <label className="label-wrap">
                  <span className="label">{t('item.field_condition')}</span>
                  <select value={editCondition} onChange={(e) => setEditCondition(e.target.value)} className="input">
                    <option value="">–</option>
                    {(['NEW', 'GOOD', 'WORN', 'BROKEN'] as ItemCondition[]).map((c) => (
                      <option key={c} value={c}>{t(`condition.${c}`)}</option>
                    ))}
                  </select>
                </label>
                <label className="label-wrap">
                  <span className="label">{t('item.field_serial')}</span>
                  <input value={editSerialNumber} onChange={(e) => setEditSerialNumber(e.target.value)} className="input" />
                </label>
                <label className="label-wrap">
                  <span className="label">{t('item.field_barcode')}</span>
                  <input value={editBarcode} onChange={(e) => setEditBarcode(e.target.value)} className="input" />
                </label>
              </div>

              {/* Tag picker */}
              {allTags && allTags.length > 0 && (
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wide mb-2">{t('item.field_tags')}</span>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                      const selected = editTagKeys.includes(tag.key);
                      return (
                        <button
                          key={tag.key}
                          type="button"
                          onClick={() => toggleTag(tag.key)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            selected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                          }`}
                        >
                          {t(`tagNames.${tag.key}`, { defaultValue: tag.name })}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <hr className="border-gray-100" />
              <h3 className="text-sm font-medium text-gray-700">{t('item.purchase_section')}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2 label-wrap">
                  <span className="label">{t('item.field_purchase_url')}</span>
                  <input type="url" value={editPurchaseUrl} onChange={(e) => setEditPurchaseUrl(e.target.value)} placeholder="https://…" className="input" />
                </label>
                <label className="label-wrap">
                  <span className="label">{t('item.field_purchase_price')}</span>
                  <input type="number" min="0" step="0.01" value={editPurchasePrice} onChange={(e) => setEditPurchasePrice(e.target.value)} placeholder="0.00" className="input" />
                </label>
                <label className="label-wrap">
                  <span className="label">{t('item.field_purchase_date')}</span>
                  <input type="date" value={editPurchaseDate} onChange={(e) => setEditPurchaseDate(e.target.value)} className="input" />
                </label>
                <label className="label-wrap">
                  <span className="label">{t('item.field_warranty')}</span>
                  <input type="date" value={editWarrantyUntil} onChange={(e) => setEditWarrantyUntil(e.target.value)} className="input" />
                </label>
              </div>

              <hr className="border-gray-100" />
              <h3 className="text-sm font-medium text-gray-700">{t('item.expiry_section')}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="label-wrap">
                  <span className="label">{t('item.field_expiry_date')}</span>
                  <input type="date" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)} className="input" />
                </label>
                <label className="label-wrap">
                  <span className="label">{t('item.field_expiry_warning_days')}</span>
                  <input type="number" min="1" value={editExpiryWarningDays} onChange={(e) => setEditExpiryWarningDays(e.target.value)} placeholder="30" className="input" />
                </label>
              </div>

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
            /* ── Anzeige ──────────────────────────────────────────────── */
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{item.name}</h1>
                  {item.description && <p className="text-gray-600 text-sm mt-1">{item.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.condition && (
                    <span className={`text-xs px-2.5 py-1 rounded-full ${CONDITION_COLORS[item.condition as ItemCondition]}`}>
                      {t(`condition.${item.condition}`)}
                    </span>
                  )}
                  {isEditor && (
                    <>
                      <button
                        type="button"
                        onClick={openMove}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                        title={t('item.move_btn')}
                      >
                        <MoveRight size={15} />
                      </button>
                      <button type="button" onClick={startEditing} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors" title={t('item.edit_btn_title')}>
                        <Pencil size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Field label={t('item.field_quantity')}>
                  {item.quantity}{unitLabel(item.unit) ? ` ${unitLabel(item.unit)}` : ''}
                </Field>
                {item.minQuantity != null && (
                  <Field label={t('item.field_min_quantity')}>
                    <span className={item.quantity < (item.minQuantity ?? Infinity) ? 'text-red-600 font-medium' : ''}>
                      {item.minQuantity}{unitLabel(item.unit) ? ` ${unitLabel(item.unit)}` : ''}
                    </span>
                  </Field>
                )}
                {item.serialNumber && <Field label={t('item.field_serial')}>{item.serialNumber}</Field>}
                {item.barcode && <Field label={t('item.field_barcode')}>{item.barcode}</Field>}
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.tags.map(({ tag }) => (
                    <span key={tag.id} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full">
                      {t(`tagNames.${tag.key}`, { defaultValue: tag.name })}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Umhängen-Dialog ───────────────────────────────────────── */}
          {showMove && isEditor && (
            <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MoveRight size={16} className="text-indigo-500" />
                  {t('item.move_title')}
                </h2>
                <button type="button" onClick={() => setShowMove(false)} aria-label={t('common.cancel')} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="label-wrap">
                  <span className="label">{t('item.move_room_label')}</span>
                  <select
                    value={moveRoomId}
                    onChange={(e) => { setMoveRoomId(e.target.value); setMoveLocationId(''); }}
                    className="input"
                  >
                    <option value="">{t('item.move_select_room')}</option>
                    {allRooms?.map((r) => (
                      <option key={r.id} value={r.id}>{r.icon ? `${r.icon} ` : ''}{r.name}</option>
                    ))}
                  </select>
                </label>

                <label className="label-wrap">
                  <span className="label">{t('item.move_container_label')}</span>
                  <select
                    value={moveLocationId}
                    onChange={(e) => setMoveLocationId(e.target.value)}
                    className="input"
                    disabled={!moveRoomId}
                  >
                    <option value="">{t('item.move_select_container')}</option>
                    {moveLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => moveMut.mutate()}
                  disabled={!moveLocationId || moveLocationId === item.locationId || moveMut.isPending}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Check size={15} /> {moveMut.isPending ? t('common.saving') : t('common.save')}
                </button>
                <button type="button" onClick={() => setShowMove(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Ablaufdatum-Warnung (nur im Anzeigemodus) */}
          {!isEditing && item.expiryDate && (() => {
            const status = expiryStatus(item.expiryDate, item.expiryWarningDays);
            if (!status || status === 'ok') return null;
            return (
              <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${status === 'expired' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <span>⚠️</span>
                <span>
                  {status === 'expired'
                    ? t('item.expiry_expired', { date: fmt(item.expiryDate) })
                    : t('item.expiry_soon', { date: fmt(item.expiryDate) })}
                </span>
              </div>
            );
          })()}

          {/* Kaufinfos (nur im Anzeigemodus) */}
          {!isEditing && (item.purchaseUrl || item.purchasePrice || item.purchaseDate || item.warrantyUntil || item.expiryDate) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-medium text-gray-800 mb-3">{t('item.purchase_section')}</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {item.purchasePrice && <Field label={t('item.field_purchase_price')}>{item.purchasePrice.toFixed(2)} €</Field>}
                {item.purchaseDate && <Field label={t('item.field_purchase_date')}>{fmt(item.purchaseDate)}</Field>}
                {item.warrantyUntil && (
                  <Field label={t('item.field_warranty')}>
                    <span className={new Date(item.warrantyUntil) < new Date() ? 'text-red-500' : ''}>
                      {fmt(item.warrantyUntil)}
                    </span>
                  </Field>
                )}
                {item.expiryDate && (
                  <Field label={t('item.field_expiry_date')}>
                    {(() => {
                      const status = expiryStatus(item.expiryDate, item.expiryWarningDays);
                      return (
                        <span className={status === 'expired' ? 'text-red-600 font-medium' : status === 'warning' ? 'text-amber-600 font-medium' : ''}>
                          {fmt(item.expiryDate)}
                        </span>
                      );
                    })()}
                  </Field>
                )}
              </div>
              {item.purchaseUrl && (
                <a
                  href={item.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
                >
                  <ExternalLink size={14} /> {t('item.purchase_link')}
                </a>
              )}
            </div>
          )}

          {/* Ausleihen */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-gray-800">{t('item.lend_section')}</h2>
              {isEditor && !activeLending && (
                <button
                  type="button"
                  onClick={() => setShowLendForm(!showLendForm)}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <ArrowRightLeft size={14} /> {t('item.lend_btn')}
                </button>
              )}
            </div>

            {activeLending && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                <div className="font-medium text-orange-800">{t('item.lent_to', { name: activeLending.lentTo })}</div>
                <div className="text-orange-600 text-xs mt-0.5">
                  {t('item.lent_since', { date: fmt(activeLending.lentAt) })}
                  {activeLending.note && ` · ${activeLending.note}`}
                </div>
                {isEditor && (
                  <button
                    type="button"
                    onClick={() => returnMut.mutate(activeLending.id)}
                    disabled={returnMut.isPending}
                    className="mt-2 text-xs text-orange-700 hover:text-orange-900 underline"
                  >
                    {t('item.mark_returned')}
                  </button>
                )}
              </div>
            )}

            {showLendForm && isEditor && (
              <div className="space-y-2 mb-3">
                <input
                  value={lentTo}
                  onChange={(e) => setLentTo(e.target.value)}
                  placeholder={t('item.lent_to_placeholder')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  value={lentNote}
                  onChange={(e) => setLentNote(e.target.value)}
                  placeholder={t('item.note_placeholder')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => lendMut.mutate()}
                  disabled={!lentTo || lendMut.isPending}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {t('item.lend_btn')}
                </button>
              </div>
            )}

            {item.lendings && item.lendings.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('item.history_title')}</p>
                {item.lendings.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 text-sm py-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.returnedAt ? 'bg-green-400' : 'bg-orange-400'}`} />
                    <span className="text-gray-700">{l.lentTo}</span>
                    <span className="text-gray-400 text-xs">
                      {fmt(l.lentAt)} → {l.returnedAt ? fmt(l.returnedAt) : t('item.still_lent')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dokumente */}
          {!isEditing && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium text-gray-800 flex items-center gap-2">
                  <FileText size={16} /> {t('item.documents_section')}
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
              {!item.documents?.length ? (
                <p className="text-sm text-gray-400">{t('item.documents_empty')}</p>
              ) : (
                <div className="space-y-2">
                  {item.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-xl flex-shrink-0">
                        {doc.mimeType === 'application/pdf' ? '📄' : '🖼️'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-indigo-600 hover:underline truncate block"
                        >
                          {doc.originalName}
                        </a>
                        {doc.size && (
                          <span className="text-xs text-gray-400">
                            {doc.size < 1024 * 1024
                              ? `${(doc.size / 1024).toFixed(0)} KB`
                              : `${(doc.size / 1024 / 1024).toFixed(1)} MB`}
                          </span>
                        )}
                      </div>
                      {isEditor && (
                        <button
                          type="button"
                          title={t('common.delete')}
                          onClick={() => {
                            if (confirm(t('item.documents_delete_confirm')))
                              deleteDocMut.mutate(doc.id);
                          }}
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
          )}

          {/* Löschen */}
          {isEditor && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (confirm(t('item.confirm_delete', { name: item.name }))) deleteMut.mutate();
                }}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 size={15} /> {t('item.delete_btn')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="block text-gray-800 mt-0.5">{children}</span>
    </div>
  );
}
