import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Plus, Folder, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getRoom, createLocation, updateRoom } from '../api/rooms';
import { getContainerTypes } from '../api/containerTypes';
import { useAuth } from '../contexts/AuthContext';
import type { Location } from '../types';
import Spinner from '../components/Spinner';

const DEPTH_PADDING = ['pl-0', 'pl-5', 'pl-10', 'pl-16', 'pl-20'] as const;

function LocationNode({ loc, depth = 0 }: { loc: Location; depth?: number }) {
  const { t } = useTranslation();
  const pl = DEPTH_PADDING[Math.min(depth, DEPTH_PADDING.length - 1)];
  return (
    <div className={pl}>
      <Link
        to={`/locations/${loc.id}`}
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-100 group"
      >
        <Folder size={16} className="text-indigo-400 flex-shrink-0" />
        <span className="flex-1 text-gray-800 text-sm font-medium">{loc.name}</span>
        {loc.containerType && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {loc.containerType.icon} {loc.containerType.name}
          </span>
        )}
        <span className="text-xs text-gray-400">{t('common.items_count', { count: loc._count?.items ?? 0 })}</span>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
      </Link>
      {loc.children?.map((child) => (
        <LocationNode key={child.id} loc={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function RoomDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isEditor = user?.role === 'EDITOR';

  const { data: room, isLoading } = useQuery({
    queryKey: ['rooms', id],
    queryFn: () => getRoom(id!),
  });
  const { data: containerTypes } = useQuery({
    queryKey: ['container-types'],
    queryFn: getContainerTypes,
  });

  const [showForm, setShowForm] = useState(false);
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const create = useMutation({
    mutationFn: () => createLocation(id!, { name: locName, containerTypeId: locType || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', id] });
      setLocName('');
      setLocType('');
      setShowForm(false);
    },
  });

  const update = useMutation({
    mutationFn: () => updateRoom(id!, { name: editName, icon: editIcon || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', id] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      setIsEditing(false);
    },
  });

  const startEdit = () => {
    setEditName(room!.name);
    setEditIcon(room!.icon ?? '');
    setIsEditing(true);
  };

  if (isLoading) return <Spinner />;
  if (!room) return <p className="text-gray-500">{t('rooms.not_found')}</p>;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/rooms" className="hover:text-indigo-600">{t('nav.rooms')}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{room.name}</span>
      </div>

      {isEditing ? (
        <div className="mb-6 bg-white border border-indigo-400 rounded-xl p-4">
          <h2 className="font-medium text-gray-800 mb-3">{t('rooms.edit_title')}</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              aria-label={t('common.emoji_placeholder')}
              value={editIcon}
              onChange={(e) => setEditIcon(e.target.value)}
              placeholder={t('rooms.icon_placeholder')}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              aria-label={t('common.name')}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editName) update.mutate();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <button
              type="button"
              onClick={() => update.mutate()}
              disabled={!editName || update.isPending}
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{room.icon} {room.name}</h1>
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
          {isEditor && (
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} /> {t('roomDetail.add_container')}
            </button>
          )}
        </div>
      )}

      {isEditor && showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-medium text-gray-800 mb-3">{t('roomDetail.new_container')}</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              aria-label={t('common.name')}
              value={locName}
              onChange={(e) => setLocName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && locName) create.mutate(); }}
              placeholder={t('roomDetail.name_placeholder')}
              className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              aria-label={t('common.type_select')}
              value={locType}
              onChange={(e) => setLocType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('common.type_select')}</option>
              {containerTypes?.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.icon} {ct.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => create.mutate()}
              disabled={!locName || create.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {create.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {!room.locations?.length ? (
          <p className="py-8 text-center text-gray-400 text-sm">
            {t('roomDetail.no_containers')}
          </p>
        ) : (
          room.locations.map((loc) => <LocationNode key={loc.id} loc={loc} />)
        )}
      </div>
    </div>
  );
}
