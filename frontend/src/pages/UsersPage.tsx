import { useState } from 'react';
import type { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ShieldCheck, Eye, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getUsers, createUser, updateUserRole, deleteUser, resetUserPassword } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import Spinner from '../components/Spinner';

export default function UsersPage() {
  const { t, i18n } = useTranslation();
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

  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const resetMut = useMutation({
    mutationFn: () => resetUserPassword(resetId!, newPassword),
    onSuccess: () => {
      setResetId(null);
      setNewPassword('');
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('users.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> {t('users.add_btn')}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-medium text-gray-800 mb-4">{t('users.new_title')}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('users.name_placeholder')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('common.email')}
              type="email"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('users.password_placeholder')}
              type="password"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              aria-label={t('users.role_aria')}
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="VIEWER">{t('users.role_viewer')}</option>
              <option value="EDITOR">{t('users.role_editor')}</option>
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => createMut.mutate()}
              disabled={!email || password.length < 8 || createMut.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMut.isPending ? t('common.saving') : t('users.create_btn')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
          </div>
          {createMut.isError && (
            <p className="mt-2 text-sm text-red-600">
              {(createMut.error as AxiosError<{ error: string }>)?.response?.data?.error ?? t('users.error_create')}
            </p>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {users?.map((u) => (
          <div key={u.id}>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">
                  {u.name ?? u.email}
                  {u.id === me?.id && (
                    <span className="ml-2 text-xs text-gray-400">{t('users.me_badge')}</span>
                  )}
                </div>
                {u.name && <div className="text-xs text-gray-500">{u.email}</div>}
                <div className="text-xs text-gray-400 mt-0.5">
                  {t('users.member_since', { date: new Date(u.createdAt).toLocaleDateString(i18n.language) })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RoleBadge role={u.role} />
                {u.id !== me?.id && (
                  <select
                    aria-label={t('users.role_change_aria')}
                    value={u.role}
                    onChange={(e) => roleMut.mutate({ id: u.id, newRole: e.target.value as UserRole })}
                    disabled={roleMut.isPending}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="VIEWER">{t('users.role_viewer_short')}</option>
                    <option value="EDITOR">{t('users.role_editor_short')}</option>
                  </select>
                )}
              </div>

              {u.id !== me?.id && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setResetId(resetId === u.id ? null : u.id); setNewPassword(''); }}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                    title={t('users.reset_password_btn')}
                  >
                    <KeyRound size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(t('users.confirm_delete', { name: u.name ?? u.email })))
                        deleteMut.mutate(u.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                    title={t('users.delete_title')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            {resetId === u.id && (
              <div className="px-5 pb-4 flex gap-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('users.reset_new_password')}
                  autoFocus
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => resetMut.mutate()}
                  disabled={newPassword.length < 8 || resetMut.isPending}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {resetMut.isPending ? t('common.saving') : t('users.reset_password_btn')}
                </button>
                <button
                  type="button"
                  onClick={() => { setResetId(null); setNewPassword(''); }}
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const { t } = useTranslation();
  if (role === 'EDITOR') {
    return (
      <span className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
        <ShieldCheck size={12} /> {t('users.role_editor_short')}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
      <Eye size={12} /> {t('users.role_viewer_short')}
    </span>
  );
}
