/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('$2b$12$hashed') },
}));

vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'editor-id';
    req.userRole = 'EDITOR';
    next();
  },
  requireEditor: (_req: any, _res: any, next: any) => next(),
}));

import usersRouter from '../routes/users';
import { prisma } from '../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);
app.use(errorHandler);

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'EDITOR' as const,
  createdAt: new Date(),
};

describe('GET /api/users', () => {
  it('gibt Liste aller Nutzer ohne passwordHash zurück', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser] as any);

    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].email).toBe('test@example.com');
    expect(res.body[0].passwordHash).toBeUndefined();
  });
});

describe('POST /api/users', () => {
  beforeEach(() => vi.mocked(prisma.user.findUnique).mockResolvedValue(null));

  it('erstellt Nutzer und gibt 201 zurück', async () => {
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

    const res = await request(app)
      .post('/api/users')
      .send({ email: 'new@example.com', password: 'sicherespasswort', role: 'VIEWER' });

    expect(res.status).toBe(201);
  });

  it('verwendet VIEWER als Standard-Rolle', async () => {
    vi.mocked(prisma.user.create).mockResolvedValue({ ...mockUser, role: 'VIEWER' } as any);

    await request(app)
      .post('/api/users')
      .send({ email: 'new@example.com', password: 'sicherespasswort' });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'VIEWER' }) }),
    );
  });

  it('gibt 409 zurück wenn E-Mail bereits vergeben', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const res = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', password: 'sicherespasswort' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('E-Mail bereits vergeben');
  });

  it('gibt 400 bei ungültiger E-Mail zurück', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'keine-email', password: 'sicherespasswort' });
    expect(res.status).toBe(400);
  });

  it('gibt 400 bei zu kurzem Passwort zurück', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'new@example.com', password: 'kurz' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/users/:id/role', () => {
  it('ändert die Rolle auf VIEWER', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, role: 'VIEWER' } as any);

    const res = await request(app)
      .put('/api/users/user-1/role')
      .send({ role: 'VIEWER' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('VIEWER');
  });

  it('gibt 404 zurück wenn Nutzer nicht gefunden', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/users/nonexistent/role')
      .send({ role: 'VIEWER' });

    expect(res.status).toBe(404);
  });

  it('gibt 400 bei ungültiger Rolle zurück', async () => {
    const res = await request(app)
      .put('/api/users/user-1/role')
      .send({ role: 'SUPERADMIN' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/users/:id', () => {
  it('löscht einen Nutzer und antwortet 204', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.delete).mockResolvedValue(mockUser as any);

    const res = await request(app).delete('/api/users/user-1');

    expect(res.status).toBe(204);
  });

  it('gibt 400 zurück wenn eigener Account gelöscht werden soll', async () => {
    const res = await request(app).delete('/api/users/editor-id');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Eigenen');
  });

  it('gibt 404 zurück wenn Nutzer nicht gefunden', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const res = await request(app).delete('/api/users/nonexistent');

    expect(res.status).toBe(404);
  });
});
