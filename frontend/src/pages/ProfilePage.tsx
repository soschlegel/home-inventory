import { useState } from 'react';
import type { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, User, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../api/profile';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const handleSaveName = async () => {
    setSavingName(true);
    setNameSuccess(false);
    setNameError(null);
    try {
      const res = await updateProfile({ name: name || undefined });
      updateUser(res.user);
      setNameSuccess(true);
    } catch (err) {
      const msg = (err as AxiosError<{ error: string }>)?.response?.data?.error;
      setNameError(msg ?? t('login.error_generic'));
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    setPwSuccess(false);
    setPwError(null);
    if (newPassword !== confirmPassword) {
      setPwError(t('profile.error_mismatch'));
      return;
    }
    setSavingPw(true);
    try {
      const res = await updateProfile({ currentPassword, newPassword });
      updateUser(res.user);
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = (err as AxiosError<{ error: string }>)?.response?.data?.error;
      setPwError(
        msg === 'Aktuelles Passwort falsch'
          ? t('profile.error_wrong_password')
          : (msg ?? t('login.error_generic')),
      );
    } finally {
      setSavingPw(false);
    }
  };

  const roleLabel =
    user?.role === 'EDITOR' ? t('nav.role_editor') : t('nav.role_viewer');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('profile.subtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* Account info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <User size={20} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 mb-4">{t('profile.section_info')}</h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t('profile.field_email')}
                  </label>
                  <div className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    {user?.email}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t('profile.field_role')}
                  </label>
                  <div className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    {roleLabel}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t('profile.field_name')}
                  </label>
                  <div className="flex gap-3">
                    <input
                      value={name}
                      onChange={(e) => { setName(e.target.value); setNameSuccess(false); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {savingName ? t('common.saving') : t('profile.save_name')}
                    </button>
                  </div>
                  {nameSuccess && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-green-700">
                      <CheckCircle size={14} /> {t('profile.success_name')}
                    </div>
                  )}
                  {nameError && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                      <AlertCircle size={14} /> {nameError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Lock size={20} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 mb-4">{t('profile.section_password')}</h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t('profile.field_current_password')}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setPwSuccess(false); setPwError(null); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t('profile.field_new_password')}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPwSuccess(false); setPwError(null); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t('profile.field_confirm_password')}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPwSuccess(false); setPwError(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleChangePassword(); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={savingPw || !currentPassword || !newPassword || !confirmPassword}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
                >
                  {savingPw ? t('common.saving') : t('profile.save_password')}
                </button>

                {pwSuccess && (
                  <div className="flex items-center gap-1.5 text-sm text-green-700">
                    <CheckCircle size={14} /> {t('profile.success_password')}
                  </div>
                )}
                {pwError && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle size={14} /> {pwError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
