import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ExternalLink, Trash2, Upload, ArrowRightLeft, Pencil, X, Check, MoveRight, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getInstance, updateInstance, deleteInstance, uploadInstanceDocument, deleteInstanceDocument } from '../api/instances';
import { lendInstance, returnItem } from '../api/lendings';
import { getUnits } from '../api/units';
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

export default function InstanceDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditor = user?.role === 'EDITOR';

  const { data: instance, isLoading } = useQuery({
    queryKey: ['instances', id],
    queryFn: () => getInstance(id!),
  });
  const { data: units } = useQuery({ queryKey: ['units'], queryFn: getUnits });

  // ── Edit state ──────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editMinQty, setEditMinQty] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [editPurchaseUrl, setEditPurchaseUrl] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState('');
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [editWarrantyUntil, setEditWarrantyUntil] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editExpiryWarningDays, setEditExpiryWarningDays] = useState('');

  function startEditing() {
    if (!instance) return;
    setEditQuantity(String(instance.quantity));
    setEditUnit(instance.unit ?? '');
    setEditMinQty(instance.minQuantity != null ? String(instance.minQuantity) : '');
    setEditCondition(instance.condition ?? '');
    setEditSerialNumber(instance.serialNumber ?? '');
    setEditPurchaseUrl(instance.purchaseUrl ?? '');
    setEditPurchasePrice(instance.purchasePrice != null ? String(instance.purchasePrice) : '');
    setEditPurchaseDate(instance.purchaseDate ? instance.purchaseDate.slice(0, 10) : '');
    setEditWarrantyUntil(instance.warrantyUntil ? instance.warrantyUntil.slice(0, 10) : '');
    setEditExpiryDate(instance.expiryDate ? instance.expiryDate.slice(0, 10) : '');
    setEditExpiryWarningDays(instance.expiryWarningDays != null ? String(instance.expiryWarningDays) : '');
    setIsEditing(true);
  }

  const updateMut = useMutation({
    mutationFn: () => updateInstance(id!, {
      quantity: parseFloat(editQuantity) || 1,
      unit: editUnit || undefined,
      minQuantity: editMinQty ? parseFloat(editMinQty) : undefined,
      condition: (editCondition as ItemCondition) || undefined,
      serialNumber: editSerialNumber || undefined,
      purchaseUrl: editPurchaseUrl || undefined,
      purchasePrice: editPurchasePrice ? parseFloat(editPurchasePrice) : undefined,
      purchaseDate: editPurchaseDate || undefined,
      warrantyUntil: editWarrantyUntil || undefined,
      expiryDate: editExpiryDate || undefined,
      expiryWarningDays: editExpiryWarningDays ? parseInt(editExpiryWarningDays) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instances', id] });
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
    mutationFn: () => updateInstance(id!, { locationId: moveLocationId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instances', id] });
      setShowMove(false);
      setMoveRoomId('');
      setMoveLocationId('');
    },
  });

  function openMove() {
    setMoveRoomId(instance?.location?.room?.id ?? '');
    setMoveLocationId(instance?.locationId ?? '');
    setShowMove(true);
  }

  // ── Lending state ───────────────────────────────────────────────────
  const [showLendForm, setShowLendForm] = useState(false);
  const [lentTo, setLentTo] = useState('');
  const [lentNote, setLentNote] = useState('');

  const lendMut = useMutation({
    mutationFn: () => lendInstance(id!, { lentTo, note: lentNote || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instances', id] });
      qc.invalidateQueries({ queryKey: ['lendings'] });
      setLentTo(''); setLentNote(''); setShowLendForm(false);
    },
  });

  const returnMut = useMutation({
    mutationFn: (lendingId: string) => returnItem(lendingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instances', id] });
      qc.invalidateQueries({ queryKey: ['lendings'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteInstance(id!),
    onSuccess: () => navigate(instance?.locationId ? `/locations/${instance.locationId}` : '/instances-overview'),
  });

  const uploadDocMut = useMutation({
    mutationFn: (file: File) => uploadInstanceDocument(id!, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instances', id] }),
  });

  const deleteDocMut = useMutation({
    mutationFn: (docId: string) => deleteInstanceDocument(id!, docId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instances', id] }),
  });

  if (isLoading) return <Spinner />;
  if (!instance) return <p className="text-gray-500">{t('instance.not_found')}</p>;

  const activeLending = instance.lendings?.find((l) => !l.returnedAt);
  const fmt = (date?: string | null) =>
    date ? new Date(date).toLocaleDateString(i18n.language) : '–';

  const expiryStatus = (expiryDate?: string | null, warningDays?: number | null) => {
    if (!expiryDate) return null;
    const now = new Date(); const exp = new Date(expiryDate);
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
        <Link to="/products" className="hover:text-indigo-600">{t('nav.products')}</Link>
        <ChevronRight size={14} />
        <Link to={`/products/${instance.productId}`} className="hover:text-indigo-600">
          {instance.product.name}
        </Link>
        {instance.location && (
          <>
            <ChevronRight size={14} />
            <Link to={`/locations/${instance.locationId}`} className="hover:text-indigo-600">
              {instance.location.name}
            </Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{t('instance.breadcrumb')}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Produktbild */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {instance.product.imageUrl ? (
              <img src={instance.product.imageUrl} alt={instance.product.name} className="w-full aspect-square object-cover" />
            ) : (
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-5xl">📦</div>
            )}
            <div className="px-4 py-3 border-t border-gray-100 text-center">
              <Link to={`/products/${instance.productId}`} className="text-sm text-indigo-600 hover:underline">
                {t('instance.view_product')}
              </Link>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          {isEditing ? (
            <div className="bg-white border border-indigo-300 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{t('instance.edit_title')}</h2>
                <button type="button" onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="label-wrap">
                  <span className="label">{t('item.field_quantity')}</span>
                  <input type="number" min="0" step="0.1" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="input" />
                </label>
                <label className="label-wrap">
                  <span className="label">{t('item.field_unit')}</span>
                  <select value={editUnit} onChange={(e) => setEditUnit(e.target.value)} className="input" aria-label={t('item.field_unit')}>
                    <option value="">{t('item.tags_none')}</option>
                    {units?.map((u) => (
                      <option key={u.id} value={u.key}>{t(`unitNames.${u.key}`, { defaultValue: u.name })}</option>
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
              </div>

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
                  disabled={updateMut.isPending}
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
                  <h1 className="text-xl font-bold text-gray-900">{instance.product.name}</h1>
                  {instance.product.description && <p className="text-gray-600 text-sm mt-1">{instance.product.description}</p>}
                  {instance.location && (
                    <p className="text-sm text-gray-500 mt-1">
                      📍 <Link to={`/rooms/${instance.location.room?.id}`} className="hover:text-indigo-600">
                        {instance.location.room?.name}
                      </Link>
                      {' › '}
                      <Link to={`/locations/${instance.locationId}`} className="hover:text-indigo-600">
                        {instance.location.name}
                      </Link>
                    </p>
                  )}
                  {instance.assignedUser && (
                    <p className="text-sm text-gray-500 mt-1">
                      👤 {instance.assignedUser.name ?? instance.assignedUser.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {instance.condition && (
                    <span className={`text-xs px-2.5 py-1 rounded-full ${CONDITION_COLORS[instance.condition as ItemCondition]}`}>
                      {t(`condition.${instance.condition}`)}
                    </span>
                  )}
                  {isEditor && (
                    <>
                      <button type="button" onClick={openMove} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors" title={t('item.move_btn')}>
                        <MoveRight size={15} />
                      </button>
                      <button type="button" onClick={startEditing} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors" title={t('common.edit')}>
                        <Pencil size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Field label={t('item.field_quantity')}>
                  {instance.quantity}{unitLabel(instance.unit) ? ` ${unitLabel(instance.unit)}` : ''}
                </Field>
                {instance.minQuantity != null && (
                  <Field label={t('item.field_min_quantity')}>
                    <span className={instance.quantity < (instance.minQuantity ?? Infinity) ? 'text-red-600 font-medium' : ''}>
                      {instance.minQuantity}{unitLabel(instance.unit) ? ` ${unitLabel(instance.unit)}` : ''}
                    </span>
                  </Field>
                )}
                {instance.serialNumber && <Field label={t('item.field_serial')}>{instance.serialNumber}</Field>}
                {instance.product.barcode && <Field label={t('item.field_barcode')}>{instance.product.barcode}</Field>}
              </div>

              {instance.product.tags && instance.product.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {instance.product.tags.map(({ tag }) => (
                    <span key={tag.id} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full">
                      {t(`tagNames.${tag.key}`, { defaultValue: tag.name })}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Umhängen-Dialog */}
          {showMove && isEditor && (
            <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MoveRight size={16} className="text-indigo-500" />
                  {t('item.move_title')}
                </h2>
                <button type="button" onClick={() => setShowMove(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="label-wrap">
                  <span className="label">{t('item.move_room_label')}</span>
                  <select value={moveRoomId} onChange={(e) => { setMoveRoomId(e.target.value); setMoveLocationId(''); }} className="input">
                    <option value="">{t('item.move_select_room')}</option>
                    {allRooms?.map((r) => (
                      <option key={r.id} value={r.id}>{r.icon ? `${r.icon} ` : ''}{r.name}</option>
                    ))}
                  </select>
                </label>
                <label className="label-wrap">
                  <span className="label">{t('item.move_container_label')}</span>
                  <select value={moveLocationId} onChange={(e) => setMoveLocationId(e.target.value)} className="input" disabled={!moveRoomId}>
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
                  disabled={!moveLocationId || moveLocationId === instance.locationId || moveMut.isPending}
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

          {/* Ablaufdatum-Warnung */}
          {!isEditing && instance.expiryDate && (() => {
            const status = expiryStatus(instance.expiryDate, instance.expiryWarningDays);
            if (!status || status === 'ok') return null;
            return (
              <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${status === 'expired' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <span>⚠️</span>
                <span>{status === 'expired' ? t('item.expiry_expired', { date: fmt(instance.expiryDate) }) : t('item.expiry_soon', { date: fmt(instance.expiryDate) })}</span>
              </div>
            );
          })()}

          {/* Kaufinfos */}
          {!isEditing && (instance.purchaseUrl || instance.purchasePrice || instance.purchaseDate || instance.warrantyUntil || instance.expiryDate) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-medium text-gray-800 mb-3">{t('item.purchase_section')}</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {instance.purchasePrice && <Field label={t('item.field_purchase_price')}>{instance.purchasePrice.toFixed(2)} €</Field>}
                {instance.purchaseDate && <Field label={t('item.field_purchase_date')}>{fmt(instance.purchaseDate)}</Field>}
                {instance.warrantyUntil && (
                  <Field label={t('item.field_warranty')}>
                    <span className={new Date(instance.warrantyUntil) < new Date() ? 'text-red-500' : ''}>
                      {fmt(instance.warrantyUntil)}
                    </span>
                  </Field>
                )}
                {instance.expiryDate && (
                  <Field label={t('item.field_expiry_date')}>
                    {(() => {
                      const status = expiryStatus(instance.expiryDate, instance.expiryWarningDays);
                      return (
                        <span className={status === 'expired' ? 'text-red-600 font-medium' : status === 'warning' ? 'text-amber-600 font-medium' : ''}>
                          {fmt(instance.expiryDate)}
                        </span>
                      );
                    })()}
                  </Field>
                )}
              </div>
              {instance.purchaseUrl && (
                <a href={instance.purchaseUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
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
                <button type="button" onClick={() => setShowLendForm(!showLendForm)} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700">
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
                  <button type="button" onClick={() => returnMut.mutate(activeLending.id)} disabled={returnMut.isPending} className="mt-2 text-xs text-orange-700 hover:text-orange-900 underline">
                    {t('item.mark_returned')}
                  </button>
                )}
              </div>
            )}
            {showLendForm && isEditor && (
              <div className="space-y-2 mb-3">
                <input value={lentTo} onChange={(e) => setLentTo(e.target.value)} placeholder={t('item.lent_to_placeholder')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input value={lentNote} onChange={(e) => setLentNote(e.target.value)} placeholder={t('item.note_placeholder')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="button" onClick={() => lendMut.mutate()} disabled={!lentTo || lendMut.isPending} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {t('item.lend_btn')}
                </button>
              </div>
            )}
            {instance.lendings && instance.lendings.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('item.history_title')}</p>
                {instance.lendings.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 text-sm py-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.returnedAt ? 'bg-green-400' : 'bg-orange-400'}`} />
                    <span className="text-gray-700">{l.lentTo}</span>
                    <span className="text-gray-400 text-xs">{fmt(l.lentAt)} → {l.returnedAt ? fmt(l.returnedAt) : t('item.still_lent')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instanz-Dokumente */}
          {!isEditing && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium text-gray-800 flex items-center gap-2">
                  <FileText size={16} /> {t('instance.documents_section')}
                </h2>
                {isEditor && (
                  <label className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer">
                    <Upload size={14} /> {t('item.documents_upload')}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDocMut.mutate(e.target.files[0])} />
                  </label>
                )}
              </div>
              {!instance.documents?.length ? (
                <p className="text-sm text-gray-400">{t('item.documents_empty')}</p>
              ) : (
                <div className="space-y-2">
                  {instance.documents.map((doc) => (
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
                        <button type="button" title={t('common.delete')} onClick={() => { if (confirm(t('item.documents_delete_confirm'))) deleteDocMut.mutate(doc.id); }} className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0">
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
                onClick={() => { if (confirm(t('instance.confirm_delete'))) deleteMut.mutate(); }}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 size={15} /> {t('instance.delete_btn')}
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
