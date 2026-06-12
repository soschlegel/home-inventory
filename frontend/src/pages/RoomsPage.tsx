import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { getRooms, createRoom, deleteRoom } from '../api/rooms';
import Spinner from '../components/Spinner';

export default function RoomsPage() {
  const qc = useQueryClient();
  const { data: rooms, isLoading } = useQuery({ queryKey: ['rooms'], queryFn: getRooms });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  const create = useMutation({
    mutationFn: () => createRoom({ name, icon: icon || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      setName('');
      setIcon('');
      setShowForm(false);
    },
  });

  const remove = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Räume</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Raum hinzufügen
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-medium text-gray-800 mb-3">Neuer Raum</h2>
          <div className="flex gap-3">
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Emoji (z.B. 🍳)"
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Raumname"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => create.mutate()}
              disabled={!name || create.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {create.isPending ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {rooms?.map((room) => (
          <div key={room.id} className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-sm transition-all">
            <Link to={`/rooms/${room.id}`} className="block">
              <div className="text-3xl mb-2">{room.icon ?? '🏠'}</div>
              <div className="font-semibold text-gray-900">{room.name}</div>
              <div className="text-sm text-gray-500 mt-0.5">
                {room._count?.locations ?? 0} Container
              </div>
            </Link>
            <button
              onClick={() => {
                if (confirm(`Raum "${room.name}" wirklich löschen?`)) remove.mutate(room.id);
              }}
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
