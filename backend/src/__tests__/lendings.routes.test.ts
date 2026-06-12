/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    lending: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    item: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'test-user-id';
    req.userRole = 'EDITOR';
    next();
  },
  requireEditor: (_req: any, _res: any, next: any) => next(),
}));

import lendingsRouter from '../routes/lendings';
import { prisma } from '../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/lendings', lendingsRouter);
app.use('/api', lendingsRouter);
app.use(errorHandler);

const mockItem = { id: 'item-1', name: 'Hammer' };

const mockLending = {
  id: 'lending-1',
  itemId: 'item-1',
  lentTo: 'Klaus Müller',
  lentAt: new Date(),
  returnedAt: null,
  note: null,
  createdAt: new Date(),
};

describe('GET /api/lendings/active', () => {
  it('gibt alle aktiven Ausleihen zurück', async () => {
    vi.mocked(prisma.lending.findMany).mockResolvedValue([mockLending] as any);

    const res = await request(app).get('/api/lendings/active');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].lentTo).toBe('Klaus Müller');
    expect(res.body[0].returnedAt).toBeNull();
  });
});

describe('GET /api/lendings/:id', () => {
  it('gibt eine einzelne Ausleihe zurück', async () => {
    vi.mocked(prisma.lending.findFirst).mockResolvedValue(mockLending as any);

    const res = await request(app).get('/api/lendings/lending-1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('lending-1');
  });

  it('gibt 404 zurück wenn Ausleihe nicht gefunden', async () => {
    vi.mocked(prisma.lending.findFirst).mockResolvedValue(null);

    const res = await request(app).get('/api/lendings/nonexistent');

    expect(res.status).toBe(404);
  });
});

describe('POST /api/items/:itemId/lend', () => {
  it('erstellt eine Ausleihe und gibt 201 zurück', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(mockItem as any);
    vi.mocked(prisma.lending.create).mockResolvedValue(mockLending as any);

    const res = await request(app)
      .post('/api/items/item-1/lend')
      .send({ lentTo: 'Klaus Müller', note: 'Für Renovierung' });

    expect(res.status).toBe(201);
    expect(res.body.lentTo).toBe('Klaus Müller');
  });

  it('gibt 400 zurück wenn lentTo fehlt', async () => {
    const res = await request(app)
      .post('/api/items/item-1/lend')
      .send({});
    expect(res.status).toBe(400);
  });

  it('gibt 404 zurück wenn Item nicht gefunden', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/items/nonexistent/lend')
      .send({ lentTo: 'Klaus Müller' });

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/lendings/:id/return', () => {
  it('markiert eine Ausleihe als zurückgegeben', async () => {
    vi.mocked(prisma.lending.findFirst).mockResolvedValue(mockLending as any);
    const returned = { ...mockLending, returnedAt: new Date() };
    vi.mocked(prisma.lending.update).mockResolvedValue(returned as any);

    const res = await request(app).put('/api/lendings/lending-1/return');

    expect(res.status).toBe(200);
    expect(res.body.returnedAt).not.toBeNull();
  });

  it('gibt 409 zurück wenn bereits zurückgegeben', async () => {
    vi.mocked(prisma.lending.findFirst).mockResolvedValue({
      ...mockLending,
      returnedAt: new Date(),
    } as any);

    const res = await request(app).put('/api/lendings/lending-1/return');

    expect(res.status).toBe(409);
  });

  it('gibt 404 zurück wenn Ausleihe nicht gefunden', async () => {
    vi.mocked(prisma.lending.findFirst).mockResolvedValue(null);

    const res = await request(app).put('/api/lendings/nonexistent/return');

    expect(res.status).toBe(404);
  });
});

describe('GET /api/items/:itemId/lendings', () => {
  it('gibt Verleihistorie zurück', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(mockItem as any);
    vi.mocked(prisma.lending.findMany).mockResolvedValue([mockLending] as any);

    const res = await request(app).get('/api/items/item-1/lendings');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('gibt 404 zurück wenn Item nicht gefunden', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    const res = await request(app).get('/api/items/nonexistent/lendings');

    expect(res.status).toBe(404);
  });
});
