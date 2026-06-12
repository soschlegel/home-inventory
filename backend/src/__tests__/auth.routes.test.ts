/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

// Prisma und bcrypt werden vor dem Import des Routers gemockt
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$hashed'),
    compare: vi.fn(),
  },
}));

import authRouter from '../routes/auth';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use(errorHandler);

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '$2b$12$hashed',
  name: 'Test User',
  role: 'EDITOR' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: 'EDITOR',
    } as any);
  });

  it('gibt 201 mit user, role und tokens zurück', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'sicherespasswort' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.role).toBe('EDITOR');
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('gibt 409 zurück wenn E-Mail bereits existiert', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'sicherespasswort' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('E-Mail bereits registriert');
  });

  it('gibt 400 bei ungültiger E-Mail zurück', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'keine-email', password: 'sicherespasswort' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validierungsfehler');
  });

  it('gibt 400 bei zu kurzem Passwort zurück', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'kurz' });

    expect(res.status).toBe(400);
  });

  it('gibt 400 ohne Body zurück', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('gibt 200 mit tokens bei korrekten Zugangsdaten zurück', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'sicherespasswort' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.id).toBe(mockUser.id);
  });

  it('gibt 401 bei falschem Passwort zurück', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'falschespasswort' });

    expect(res.status).toBe(401);
  });

  it('gibt 401 bei unbekannter E-Mail zurück', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unbekannt@example.com', password: 'irgendwas' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('gibt neuen accessToken zurück bei gültigem refreshToken', async () => {
    const { signRefresh } = await import('../utils/jwt');
    const refreshToken = signRefresh('user-1');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', role: 'EDITOR' } as any);

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('gibt 400 zurück wenn refreshToken fehlt', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });
});
