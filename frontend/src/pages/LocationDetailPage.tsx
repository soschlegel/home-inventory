import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Plus, Package, Folder, Trash2, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocation, getLocationItems, createItem, deleteLocation, updateLocation } from '../api/locations';
import { createLocation } from '../api/rooms';
import { getContainerTypes } from '../api/containerTypes';
import { getUnits } from '../api/units';
import { useAuth } from '../contexts/AuthContext';
import { locContainerTypeName, locRoomName } from '../utils/localizedName';
import type { ItemCondition } from '../types';
import { CONDITION_COLORS } from '../types';
import Spinner from '../components/Spinner';

export default function LocationDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isEditor = user?.role === 'EDITOR';

  const { data: location, isLoading } = useQuery({
    queryKey: ['locations', id],
    queryFn: () => getLocation(id!),
  });
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['locations', id, 'items'],
    queryFn: () => getLocationItems(id!),
  });
  const { data: containerTypes } = useQuery({
    queryKey: ['container-types'],
    queryFn: getContainerTypes,
  });
  const { data: units } = useQuery({ queryKey: ['units'], queryFn: getUnits });

  // Edit location
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');

  const editMut = useMutation({
    mutationFn: () =>
      updateLocation(id!, { name: editName, containerTypeId: editType || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations', id] });
      setIsEditing(false);
    },
  });

  const startEdit = () => {
    setEditName(location!.name);
    setEditType(location!.containerTypeId ?? '');
    setIsEditing(true);
  };

  // Add item form
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemUnit, setItemUnit] = useState('');

  const createItemMut = useMutation({
    mutationFn: () =>
      createItem(id!, { name: itemName, quantity: parseFloat(itemQty) || 1, unit: itemUnit || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations', id, 'items'] });
      setItemName('');
      setItemQty('1');
      setItemUnit('');
      setShowItemForm(false);
    },
  });

  // Add sub-location form
  const [showLocForm, setShowLocForm] = useState(false);
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState('');

  const createLocMut = useMutation({
    mutationFn: () =>
      createLocation(location!.roomId, {
        name: locName,
        containerTypeId: locType || undefined,
        parentId: id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations', id] });
      setLocName('');
      setLocType('');
      setShowLocForm(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteLocation(id!),
    onSuccess: () => navigate(`/rooms/${location?.roomId}`),
  });

  if (isLoading) return <Spinner />;
  if (!location) return <p className="text-gray-500">{t('location.not_found')}</p>;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 flex-wrap">
        <Link to="/rooms" className="hover:text-indigo-600">{t('nav.rooms')}</Link>
        <ChevronRight size={14} />
        <Link to={`/rooms/${location.room?.id}`} className="hover:text-indigo-600">
          {location.room ? locRoomName(t, location.room) : ''}
        </Link>
        {location.parent && (
          <>
            <ChevronRight size={14} />
            <Link to={`/locations/${location.parent.id}`} className="hover:text-indigo-600">
              {location.parent.name}
            </Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{location.name}</span>
      </div>

      {isEditing ? (
        <div className="mb-6 bg-white border border-indigo-400 rounded-xl p-4">
          <h2 className="font-medium text-gray-800 mb-3">{t('location.edit_title')}</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              aria-label={t('common.name')}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editName) editMut.mutate();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              placeholder={t('location.name_placeholder')}
              className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <select
              aria-label={t('common.type_select')}
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{t('common.type_select')}</option>
              {containerTypes?.map((ct) => (
                <option key={ct.id} value={ct.id}>{ct.icon} {locContainerTypeName(t, ct)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => editMut.mutate()}
              disabled={!editName || editMut.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('common.save')}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{location.name}</h1>
              {isEditor && (
                <button
                  type="button"
                  aria-label={t('common.edit')}
                  onClick={startEdit}
                  className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
            {location.containerType && (
              <span className="text-sm text-gray-500">
                {location.containerType.icon} {locContainerTypeName(t, location.containerType)}
              </span>
            )}
          </div>
          {isEditor && (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowLocForm(!showLocForm)}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <Folder size={15} /> {t('location.add_subcontainer')}
              </button>
              <button
                type="button"
                onClick={() => setShowItemForm(!showItemForm)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> {t('location.add_item')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sub-location form */}
      {isEditor && showLocForm && (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-medium text-gray-800 mb-3">{t('location.new_subcontainer')}</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              aria-label={t('common.name')}
              value={locName}
              onChange={(e) => setLocName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && locName) createLocMut.mutate(); }}
              placeholder={t('location.name_placeholder')}
              className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              aria-label={t('common.type_select')}
              value={locType}
              onChange={(e) => setLocType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{t('common.type_select')}</option>
              {containerTypes?.map((ct) => (
                <option key={ct.id} value={ct.id}>{ct.icon} {locContainerTypeName(t, ct)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => createLocMut.mutate()}
              disabled={!locName || createLocMut.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Item form */}
      {isEditor && showItemForm && (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-medium text-gray-800 mb-3">{t('location.new_item')}</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              aria-label={t('common.name')}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && itemName) createItemMut.mutate(); }}
              placeholder={t('location.name_placeholder')}
              className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              aria-label={t('common.quantity')}
              value={itemQty}
              onChange={(e) => setItemQty(e.target.value)}
              type="number"
              min="0.1"
              step="0.1"
              placeholder={t('location.qty_placeholder')}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <select
              aria-label={t('common.unit')}
              value={itemUnit}
              onChange={(e) => setItemUnit(e.target.value)}
              className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{t('location.unit_placeholder')}</option>
              {units?.map((u) => (
                <option key={u.id} value={u.key}>
                  {t(`unitNames.${u.key}`, { defaultValue: u.name })}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => createItemMut.mutate()}
              disabled={!itemName || createItemMut.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Sub-locations */}
      {(location.children?.length ?? 0) > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">{t('location.subcontainers_title')}</h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {location.children?.map((child) => (
              <Link
                key={child.id}
                to={`/locations/${child.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
              >
                <Folder size={16} className="text-indigo-400" />
                <span className="flex-1 text-sm font-medium text-gray-800">{child.name}</span>
                <span className="text-xs text-gray-400">{t('common.items_count', { count: child._count?.items ?? 0 })}</span>
                <ChevronRight size={14} className="text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">{t('location.items_title')}</h2>
      {itemsLoading ? (
        <Spinner />
      ) : !items?.length ? (
        <div className="bg-white border border-gray-200 rounded-xl py-8 text-center text-gray-400 text-sm">
          {t('location.no_items')}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/items/${item.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group"
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                <div className="text-xs text-gray-500">
                  {item.quantity}{item.unit ? ` ${t(`unitNames.${item.unit}`, { defaultValue: item.unit })}` : ''}
                  {item.minQuantity !== null && item.quantity < (item.minQuantity ?? Infinity) && (
                    <span className="ml-2 text-red-500">{t('location.below_minimum')}</span>
                  )}
                </div>
              </div>
              {item.condition && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${CONDITION_COLORS[item.condition as ItemCondition]}`}>
                  {t(`condition.${item.condition}`)}
                </span>
              )}
              {(item.lendings?.some((l) => !l.returnedAt)) && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {t('location.lent_badge')}
                </span>
              )}
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
            </Link>
          ))}
        </div>
      )}

      {/* Delete location */}
      {isEditor && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              if (confirm(t('location.confirm_delete', { name: location.name })))
                deleteMut.mutate();
            }}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700"
          >
            <Trash2 size={15} /> {t('location.delete_btn')}
          </button>
        </div>
      )}
    </div>
  );
}
