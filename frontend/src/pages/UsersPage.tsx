import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ShieldCheck, Eye } from 'lucide-react';
import { getUsers, createUser, updateUserRole, deleteUser } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import Spinner from '../components/Spinner';

export default function UsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('VIEWER');

  const createMut = useMutation({
    mutationFn: () => createUser({ email, password, name: name || undefined, role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEmail(''); setPassword(''); setName(''); setRole('VIEWER');
      setShowForm(false);
    },
  });

  const roleMut = useMutation({
    mutationFn: ({ id, newRole }: { id: string; newRole: UserRole }) => updateUserRole(id, newRole),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Benutzerverwaltung</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Editoren können alles ändern, Betrachter können nur lesen.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Nutzer hinzufügen
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-medium text-gray-800 mb-4">Neuer Nutzer</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail"
              type="email"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort (min. 8 Zeichen)"
              type="password"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="VIEWER">Betrachter (nur lesen)</option>
              <option value="EDITOR">Editor (lesen & schreiben)</option>
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => createMut.mutate()}
              disabled={!email || password.length < 8 || createMut.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMut.isPending ? 'Speichern…' : 'Nutzer anlegen'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
          {createMut.isError && (
            <p className="mt-2 text-sm text-red-600">
              {(createMut.error as any)?.response?.data?.error ?? 'Fehler beim Anlegen'}
            </p>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {users?.map((u) => (
          <div key={u.id} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm">
                {u.name ?? u.email}
                {u.id === me?.id && (
                  <span className="ml-2 text-xs text-gray-400">(ich)</span>
                )}
              </div>
              {u.name && <div className="text-xs text-gray-500">{u.email}</div>}
              <div className="text-xs text-gray-400 mt-0.5">
                Mitglied seit {new Date(u.createdAt).toLocaleDateString('de-DE')}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RoleBadge role={u.role} />
              {u.id !== me?.id && (
                <select
                  value={u.role}
                  onChange={(e) => roleMut.mutate({ id: u.id, newRole: e.target.value as UserRole })}
                  disabled={roleMut.isPending}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="VIEWER">Betrachter</option>
                  <option value="EDITOR">Editor</option>
                </select>
              )}
            </div>

            {u.id !== me?.id && (
              <button
                onClick={() => {
                  if (confirm(`Nutzer "${u.name ?? u.email}" wirklich löschen?`))
                    deleteMut.mutate(u.id);
                }}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                title="Nutzer löschen"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'EDITOR') {
    return (
      <span className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
        <ShieldCheck size={12} /> Editor
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
      <Eye size={12} /> Betrachter
    </span>
  );
}
