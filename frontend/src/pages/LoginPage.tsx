import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t('login.error_generic');
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('login.title')}</h1>
        <p className="text-gray-500 text-sm mb-6">
          {mode === 'login' ? t('login.subtitle_login') : t('login.subtitle_register')}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={t('login.name_placeholder')}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="test@home.local"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 8 : undefined}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t('login.loading') : mode === 'login' ? t('login.submit_login') : t('login.submit_register')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {mode === 'login' ? t('login.no_account') : t('login.already_registered')}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-indigo-600 hover:underline font-medium"
          >
            {mode === 'login' ? t('login.submit_register') : t('login.submit_login')}
          </button>
        </p>
      </div>
    </div>
  );
}
