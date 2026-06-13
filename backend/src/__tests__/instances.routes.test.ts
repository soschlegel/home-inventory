/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
    },
    instance: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    instanceDocument: {
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../utils/upload', () => ({
  uploadDocument: {
    single: () => (req: any, _res: any, next: any) => {
      req.file = { filename: 'mock.pdf', originalname: 'rechnung.pdf', mimetype: 'application/pdf', size: 1024 };
      next();
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

import instancesRouter from '../routes/instances';
import { prisma } from '../lib/prisma';
const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use('/api/instances', instancesRouter);
app.use(errorHandler);

const mockInstance = {
  id: 'inst-1',
  productId: 'prod-1',
  product: { id: 'prod-1', name: 'Hammer', imageUrl: null, description: null, barcode: null, minQuantity: null, expiryWarningDays: null, tags: [] },
  quantity: 1,
  unit: null,
  condition: null,
  serialNumber: null,
  purchasePrice: null,
  purchaseDate: null,
  warrantyUntil: null,
  expiryDate: null,
  locationId: 'loc-1',
  assignedUserId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('POST /api/instances', () => {
  it('erstellt ein Exemplar ohne Standort und antwortet 201', async () => {
    mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1', name: 'Hammer' });
    mockPrisma.instance.create.mockResolvedValue(mockInstance);

    const res = await request(app)
      .post('/api/instances')
      .send({ productId: 'prod-1', quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.productId).toBe('prod-1');
  });

  it('erstellt ein Exemplar mit Standort und antwortet 201', async () => {
    mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1', name: 'Hammer' });
    mockPrisma.instance.create.mockResolvedValue({ ...mockInstance, locationId: 'loc-1' });

    const res = await request(app)
      .post('/api/instances')
      .send({ productId: 'prod-1', locationId: 'loc-1', quantity: 1 });

    expect(res.status).toBe(201);
  });

  it('gibt 404 zurück wenn Produkt nicht existiert', async () => {
    mockPrisma.product.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/instances')
      .send({ productId: 'nonexistent' });

    expect(res.status).toBe(404);
  });

  it('gibt 400 zurück wenn productId fehlt', async () => {
    const res = await request(app)
      .post('/api/instances')
      .send({ quantity: 1 });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/instances', () => {
  it('gibt alle Instanzen zurück', async () => {
    mockPrisma.instance.findMany.mockResolvedValue([{ ...mockInstance, _count: { lendings: 0 } }]);

    const res = await request(app).get('/api/instances');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].product.name).toBe('Hammer');
  });
});

describe('GET /api/instances/search', () => {
  it('gibt Suchergebnisse zurück', async () => {
    mockPrisma.instance.findMany.mockResolvedValue([{ ...mockInstance, _count: { lendings: 0 } }]);

    const res = await request(app).get('/api/instances/search?q=Hammer');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('gibt 400 zurück wenn q fehlt', async () => {
    const res = await request(app).get('/api/instances/search');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/instances/low-stock', () => {
  it('gibt Instanzen zurück bei denen quantity < product.minQuantity', async () => {
    const lowStock = { ...mockInstance, quantity: 1, product: { ...mockInstance.product, minQuantity: 3 } };
    const ok = { ...mockInstance, id: 'inst-2', quantity: 5, product: { ...mockInstance.product, minQuantity: 3 } };
    mockPrisma.instance.findMany.mockResolvedValue([lowStock, ok]);

    const res = await request(app).get('/api/instances/low-stock');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('inst-1');
  });
});

describe('GET /api/instances/expiring-soon', () => {
  it('gibt Instanzen zurück die innerhalb des Warnfensters ablaufen', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 5);
    const expiring = { ...mockInstance, expiryDate: soon, product: { ...mockInstance.product, expiryWarningDays: 30 } };
    mockPrisma.instance.findMany.mockResolvedValue([expiring]);

    const res = await request(app).get('/api/instances/expiring-soon');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('gibt leere Liste zurück wenn nichts ablaufend', async () => {
    const far = new Date();
    far.setFullYear(far.getFullYear() + 2);
    const ok = { ...mockInstance, expiryDate: far, product: { ...mockInstance.product, expiryWarningDays: 30 } };
    mockPrisma.instance.findMany.mockResolvedValue([ok]);

    const res = await request(app).get('/api/instances/expiring-soon');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('berücksichtigt bereits abgelaufene Instanzen', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const expired = { ...mockInstance, expiryDate: past, product: { ...mockInstance.product, expiryWarningDays: 30 } };
    mockPrisma.instance.findMany.mockResolvedValue([expired]);

    const res = await request(app).get('/api/instances/expiring-soon');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('GET /api/instances/:id', () => {
  it('gibt eine Instanz zurück', async () => {
    mockPrisma.instance.findFirst.mockResolvedValue({ ...mockInstance, documents: [], lendings: [] });

    const res = await request(app).get('/api/instances/inst-1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('inst-1');
  });

  it('gibt 404 zurück wenn nicht gefunden', async () => {
    mockPrisma.instance.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/api/instances/nonexistent');

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/instances/:id', () => {
  it('aktualisiert eine Instanz', async () => {
    mockPrisma.instance.findFirst.mockResolvedValue(mockInstance);
    mockPrisma.instance.update.mockResolvedValue({ ...mockInstance, quantity: 5 });

    const res = await request(app)
      .put('/api/instances/inst-1')
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(5);
  });

  it('gibt 404 zurück wenn nicht gefunden', async () => {
    mockPrisma.instance.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/instances/nonexistent')
      .send({ quantity: 1 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/instances/:id', () => {
  it('löscht eine Instanz und antwortet 204', async () => {
    mockPrisma.instance.findFirst.mockResolvedValue(mockInstance);
    mockPrisma.instance.delete.mockResolvedValue(mockInstance);

    const res = await request(app).delete('/api/instances/inst-1');

    expect(res.status).toBe(204);
  });

  it('gibt 404 zurück wenn nicht gefunden', async () => {
    mockPrisma.instance.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/instances/nonexistent');

    expect(res.status).toBe(404);
  });
});

describe('POST /api/instances/:id/documents', () => {
  it('erstellt ein Dokument und antwortet 201', async () => {
    mockPrisma.instance.findFirst.mockResolvedValue(mockInstance);
    mockPrisma.instanceDocument.create.mockResolvedValue({ id: 'doc-1', instanceId: 'inst-1', originalName: 'rechnung.pdf', url: '/uploads/abc.pdf' });

    const res = await request(app)
      .post('/api/instances/inst-1/documents')
      .attach('document', Buffer.from('pdf'), { filename: 'rechnung.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
  });

  it('gibt 404 zurück wenn Instanz nicht gefunden', async () => {
    mockPrisma.instance.findFirst.mockResolvedValue(null);

    const res = await request(app).post('/api/instances/nonexistent/documents');

    expect(res.status).toBe(404);
  });
});
