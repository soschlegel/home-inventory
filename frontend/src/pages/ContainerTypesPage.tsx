import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import {
  getContainerTypes,
  createContainerType,
  updateContainerType,
  deleteContainerType,
} from '../api/containerTypes';
import Spinner from '../components/Spinner';

export default function ContainerTypesPage() {
  const qc = useQueryClient();
  const { data: types, isLoading } = useQuery({
    queryKey: ['container-types'],
    queryFn: getContainerTypes,
  });

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');

  const createMut = useMutation({
    mutationFn: () => createContainerType({ name: newName, icon: newIcon || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['container-types'] });
      setNewName('');
      setNewIcon('');
      setShowForm(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteContainerType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['container-types'] }),
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const updateMut = useMutation({
    mutationFn: () => updateContainerType(editId!, { name: editName, icon: editIcon || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['container-types'] });
      setEditId(null);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Container-Typen</h1>
          <p className="text-sm text-gray-500 mt-1">
            Definiere eigene Typen für deine Container (Schrank, Schublade, Karton…)
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> Neuer Typ
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex gap-3">
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder="Emoji"
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (z.B. Schublade)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => createMut.mutate()}
              disabled={!newName || createMut.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Speichern
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {!types?.length ? (
            <p className="py-8 text-center text-gray-400 text-sm">
              Noch keine Typen. Leg einen an!
            </p>
          ) : (
            types.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                {editId === t.id ? (
                  <>
                    <input
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      placeholder="Emoji"
                      className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    />
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm"
                    />
                    <button
                      onClick={() => updateMut.mutate()}
                      disabled={!editName}
                      className="p-1.5 text-green-600 hover:text-green-700"
                    >
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xl w-8">{t.icon ?? '📦'}</span>
                    <span className="flex-1 font-medium text-gray-800 text-sm">{t.name}</span>
                    <span className="text-xs text-gray-400">{t._count?.locations ?? 0} Container</span>
                    <button
                      onClick={() => { setEditId(t.id); setEditName(t.name); setEditIcon(t.icon ?? ''); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Typ "${t.name}" löschen? Container behalten ihren Typ nicht mehr.`))
                          deleteMut.mutate(t.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
