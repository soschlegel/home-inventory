import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    item: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../utils/upload', () => ({
  upload: { single: () => (_req: any, _res: any, next: any) => next() },
}));

vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'test-user-id';
    req.userRole = 'EDITOR';
    next();
  },
  requireEditor: (_req: any, _res: any, next: any) => next(),
}));

import itemsRouter from '../routes/items';
import { prisma } from '../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/items', itemsRouter);
app.use(errorHandler);

const mockItem = {
  id: 'item-1',
  name: 'Hammer',
  description: null,
  quantity: 1,
  unit: null,
  minQuantity: null,
  condition: null,
  imageUrl: null,
  purchaseUrl: null,
  purchasePrice: null,
  purchaseDate: null,
  warrantyUntil: null,
  serialNumber: null,
  barcode: null,
  locationId: 'loc-1',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('GET /api/items/search', () => {
  it('gibt Suchergebnisse zurück', async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([mockItem] as any);

    const res = await request(app).get('/api/items/search?q=Hammer');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Hammer');
  });

  it('gibt 400 zurück wenn q fehlt', async () => {
    const res = await request(app).get('/api/items/search');
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück wenn q leer ist', async () => {
    const res = await request(app).get('/api/items/search?q=');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/items/low-stock', () => {
  it('gibt Items zurück bei denen quantity < minQuantity', async () => {
    const lowStockItem = { ...mockItem, quantity: 1, minQuantity: 3 };
    const okItem = { ...mockItem, id: 'item-2', quantity: 5, minQuantity: 3 };
    vi.mocked(prisma.item.findMany).mockResolvedValue([lowStockItem, okItem] as any);

    const res = await request(app).get('/api/items/low-stock');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('item-1');
  });

  it('gibt leere Liste zurück wenn alle Items ausreichend bevorratet sind', async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([{ ...mockItem, quantity: 5, minQuantity: 3 }] as any);

    const res = await request(app).get('/api/items/low-stock');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('GET /api/items/:id', () => {
  it('gibt das Item zurück', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(mockItem as any);

    const res = await request(app).get('/api/items/item-1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('item-1');
  });

  it('gibt 404 zurück wenn Item nicht gefunden', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    const res = await request(app).get('/api/items/nonexistent');

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/items/:id', () => {
  it('aktualisiert ein Item', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(mockItem as any);
    vi.mocked(prisma.item.update).mockResolvedValue({ ...mockItem, name: 'Schraubenzieher' } as any);

    const res = await request(app)
      .put('/api/items/item-1')
      .send({ name: 'Schraubenzieher' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Schraubenzieher');
  });

  it('wandelt leere purchaseUrl in null um', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(mockItem as any);
    vi.mocked(prisma.item.update).mockResolvedValue(mockItem as any);

    await request(app)
      .put('/api/items/item-1')
      .send({ purchaseUrl: '' });

    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ purchaseUrl: null }) }),
    );
  });

  it('gibt 404 zurück wenn Item nicht gefunden', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/items/nonexistent')
      .send({ name: 'Test' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/items/:id', () => {
  it('löscht ein Item und antwortet 204', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(mockItem as any);
    vi.mocked(prisma.item.delete).mockResolvedValue(mockItem as any);

    const res = await request(app).delete('/api/items/item-1');

    expect(res.status).toBe(204);
  });

  it('gibt 404 zurück wenn Item nicht gefunden', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    const res = await request(app).delete('/api/items/nonexistent');

    expect(res.status).toBe(404);
  });
});
