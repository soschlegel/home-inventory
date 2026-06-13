import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmojiPickerInput from '../components/EmojiPickerInput';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../api/rooms';
import { useAuth } from '../contexts/AuthContext';
import { locRoomName } from '../utils/localizedName';
import Spinner from '../components/Spinner';

export default function RoomsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isEditor = user?.role === 'EDITOR';

  const { data: rooms, isLoading } = useQuery({ queryKey: ['rooms'], queryFn: getRooms });

  const [showForm, setShowForm] = useState(false);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const create = useMutation({
    mutationFn: () => createRoom({ key: key || undefined, name, icon: icon || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      setKey('');
      setName('');
      setIcon('');
      setShowForm(false);
    },
  });

  const update = useMutation({
    mutationFn: (id: string) =>
      updateRoom(id, { key: editKey || undefined, name: editName, icon: editIcon || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      setEditingId(null);
    },
  });

  const remove = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const startEdit = (room: { id: string; key?: string | null; name: string; icon?: string | null }) => {
    setEditingId(room.id);
    setEditKey(room.key ?? '');
    setEditName(room.name);
    setEditIcon(room.icon ?? '');
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('rooms.title')}</h1>
        {isEditor && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> {t('rooms.add_btn')}
          </button>
        )}
      </div>

      {isEditor && showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-medium text-gray-800 mb-3">{t('rooms.new_title')}</h2>
          <div className="flex gap-3 flex-wrap">
            <EmojiPickerInput value={icon} onChange={setIcon} />
            <input
              aria-label={t('rooms.key_label')}
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder={t('rooms.key_placeholder')}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <input
              aria-label={t('common.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && name) create.mutate(); }}
              placeholder={t('rooms.name_placeholder')}
              className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => create.mutate()}
              disabled={!name || create.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {create.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 ml-1">{t('rooms.key_hint')}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {rooms?.map((room) =>
          editingId === room.id ? (
            <div key={room.id} className="bg-white border border-indigo-400 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-500 mb-2">{t('rooms.edit_title')}</div>
              <div className="flex gap-2 mb-2">
                <EmojiPickerInput value={editIcon} onChange={setEditIcon} />
                <input
                  aria-label={t('rooms.key_label')}
                  value={editKey}
                  onChange={(e) =>
                    setEditKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  placeholder={t('rooms.key_placeholder')}
                  className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  aria-label={t('common.name')}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editName) update.mutate(room.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => update.mutate(room.id)}
                  disabled={!editName || update.isPending}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-gray-500 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-100"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div
              key={room.id}
              className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-sm transition-all"
            >
              <Link to={`/rooms/${room.id}`} className="block">
                <div className="text-3xl mb-2">{room.icon ?? '🏠'}</div>
                <div className="font-semibold text-gray-900">{locRoomName(t, room)}</div>
                {room.key && (
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{room.key}</div>
                )}
                <div className="text-sm text-gray-500 mt-0.5">
                  {t('common.container_count', { count: room._count?.locations ?? 0 })}
                </div>
              </Link>
              {isEditor && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    type="button"
                    aria-label={t('common.edit')}
                    onClick={() => startEdit(room)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={t('common.delete')}
                    onClick={() => {
                      if (confirm(t('rooms.confirm_delete', { name: room.name })))
                        remove.mutate(room.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
