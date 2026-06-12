import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import * as authApi from '../api/auth';

vi.mock('../api/auth');

const mockAuthResponse = {
  user: { id: 'user-1', email: 'max@example.com', name: 'Max', role: 'EDITOR' as const },
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

function TestConsumer() {
  const { user, isLoading, login, logout, register } = useAuth();
  if (isLoading) return <div>loading</div>;
  if (!user) {
    return (
      <>
        <button type="button" onClick={() => login('max@example.com', 'passwort')}>login</button>
        <button type="button" onClick={() => register('neu@example.com', 'passwort', 'Neu')}>register</button>
      </>
    );
  }
  return <button type="button" onClick={logout}>logout {user.email}</button>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(authApi.login).mockResolvedValue(mockAuthResponse);
    vi.mocked(authApi.register).mockResolvedValue(mockAuthResponse);
  });

  it('startet ohne Nutzer nach dem Laden', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(await screen.findByText('login')).toBeInTheDocument();
  });

  it('stellt Nutzer aus localStorage wieder her', async () => {
    localStorage.setItem('user', JSON.stringify(mockAuthResponse.user));
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(await screen.findByText(`logout ${mockAuthResponse.user.email}`)).toBeInTheDocument();
  });

  it('login aktualisiert den Nutzerstatus und speichert Tokens', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    const btn = await screen.findByText('login');

    await act(async () => { btn.click(); });

    expect(screen.getByText(`logout ${mockAuthResponse.user.email}`)).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
    expect(JSON.parse(localStorage.getItem('user')!).email).toBe('max@example.com');
  });

  it('register speichert Tokens und setzt den Nutzer', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    const btn = await screen.findByText('register');

    await act(async () => { btn.click(); });

    expect(screen.getByText(`logout ${mockAuthResponse.user.email}`)).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
  });

  it('logout löscht localStorage und setzt Nutzer auf null', async () => {
    localStorage.setItem('user', JSON.stringify(mockAuthResponse.user));
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');

    render(<AuthProvider><TestConsumer /></AuthProvider>);
    const logoutBtn = await screen.findByText(`logout ${mockAuthResponse.user.email}`);

    await act(async () => { logoutBtn.click(); });

    expect(screen.getByText('login')).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
