import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Plus, Folder } from 'lucide-react';
import { getRoom, createLocation } from '../api/rooms';
import { getContainerTypes } from '../api/containerTypes';
import type { Location } from '../types';
import Spinner from '../components/Spinner';

function LocationNode({ loc, depth = 0 }: { loc: Location; depth?: number }) {
  return (
    <div style={{ paddingLeft: depth * 20 }}>
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
        <span className="text-xs text-gray-400">{loc._count?.items ?? 0} Items</span>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
      </Link>
      {loc.children?.map((child) => (
        <LocationNode key={child.id} loc={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

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

  const create = useMutation({
    mutationFn: () => createLocation(id!, { name: locName, containerTypeId: locType || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', id] });
      setLocName('');
      setLocType('');
      setShowForm(false);
    },
  });

  if (isLoading) return <Spinner />;
  if (!room) return <p className="text-gray-500">Raum nicht gefunden.</p>;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/rooms" className="hover:text-indigo-600">Räume</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{room.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {room.icon} {room.name}
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Container hinzufügen
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-medium text-gray-800 mb-3">Neuer Container</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              value={locName}
              onChange={(e) => setLocName(e.target.value)}
              placeholder="Name (z.B. Kühlschrank)"
              className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={locType}
              onChange={(e) => setLocType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Typ wählen…</option>
              {containerTypes?.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.icon} {ct.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => create.mutate()}
              disabled={!locName || create.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {create.isPending ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {!room.locations?.length ? (
          <p className="py-8 text-center text-gray-400 text-sm">
            Noch keine Container. Füge den ersten hinzu!
          </p>
        ) : (
          room.locations.map((loc) => <LocationNode key={loc.id} loc={loc} />)
        )}
      </div>
    </div>
  );
}
