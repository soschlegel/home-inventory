/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    productGroup: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

import productGroupsRouter from '../routes/product-groups';
import { prisma } from '../lib/prisma';
const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use('/api/product-groups', productGroupsRouter);
app.use(errorHandler);

const mockGroup = {
  id: 'grp-1',
  name: 'Milch',
  minQuantity: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { products: 2 },
};

describe('GET /api/product-groups', () => {
  it('gibt alle Gruppen zurück', async () => {
    mockPrisma.productGroup.findMany.mockResolvedValue([mockGroup]);

    const res = await request(app).get('/api/product-groups');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Milch');
  });
});

describe('GET /api/product-groups/:id', () => {
  it('gibt eine Gruppe zurück', async () => {
    mockPrisma.productGroup.findFirst.mockResolvedValue({ ...mockGroup, products: [] });

    const res = await request(app).get('/api/product-groups/grp-1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('grp-1');
  });

  it('gibt 404 zurück wenn nicht gefunden', async () => {
    mockPrisma.productGroup.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/api/product-groups/nonexistent');

    expect(res.status).toBe(404);
  });
});

describe('POST /api/product-groups', () => {
  it('erstellt eine Gruppe und antwortet 201', async () => {
    mockPrisma.productGroup.create.mockResolvedValue(mockGroup);

    const res = await request(app)
      .post('/api/product-groups')
      .send({ name: 'Milch', minQuantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Milch');
  });

  it('gibt 400 zurück bei fehlendem name', async () => {
    const res = await request(app)
      .post('/api/product-groups')
      .send({ minQuantity: 2 });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/product-groups/:id', () => {
  it('aktualisiert eine Gruppe', async () => {
    mockPrisma.productGroup.findFirst.mockResolvedValue(mockGroup);
    mockPrisma.productGroup.update.mockResolvedValue({ ...mockGroup, name: 'Milch & Co.' });

    const res = await request(app)
      .put('/api/product-groups/grp-1')
      .send({ name: 'Milch & Co.' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Milch & Co.');
  });

  it('gibt 404 zurück wenn nicht gefunden', async () => {
    mockPrisma.productGroup.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/product-groups/nonexistent')
      .send({ name: 'Test' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/product-groups/:id', () => {
  it('löscht eine Gruppe und antwortet 204', async () => {
    mockPrisma.productGroup.findFirst.mockResolvedValue(mockGroup);
    mockPrisma.productGroup.delete.mockResolvedValue(mockGroup);

    const res = await request(app).delete('/api/product-groups/grp-1');

    expect(res.status).toBe(204);
  });

  it('gibt 404 zurück wenn nicht gefunden', async () => {
    mockPrisma.productGroup.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/product-groups/nonexistent');

    expect(res.status).toBe(404);
  });
});
