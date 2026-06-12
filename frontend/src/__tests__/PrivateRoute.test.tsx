import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';
import { AuthProvider } from '../contexts/AuthContext';

vi.mock('../api/auth');

function renderWithRouter(initialPath: string, storedUser: object | null = null) {
  if (storedUser) {
    localStorage.setItem('user', JSON.stringify(storedUser));
  } else {
    localStorage.removeItem('user');
  }

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<div>Dashboard-Inhalt</div>} />
          </Route>
          <Route path="/login" element={<div>Login-Seite</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('PrivateRoute', () => {
  beforeEach(() => localStorage.clear());

  it('leitet zu /login weiter wenn nicht eingeloggt', async () => {
    renderWithRouter('/dashboard');
    expect(await screen.findByText('Login-Seite')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard-Inhalt')).not.toBeInTheDocument();
  });

  it('zeigt den geschützten Inhalt wenn eingeloggt', async () => {
    renderWithRouter('/dashboard', { id: 'u1', email: 'user@example.com' });
    expect(await screen.findByText('Dashboard-Inhalt')).toBeInTheDocument();
    expect(screen.queryByText('Login-Seite')).not.toBeInTheDocument();
  });
});
