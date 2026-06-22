/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tag: { findMany: vi.fn() },
    productDocument: {
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../utils/upload', () => ({
  upload: { single: () => (_req: any, _res: any, next: any) => next() },
  uploadDocument: {
    single: () => (req: any, _res: any, next: any) => {
      req.file = { filename: 'mock.pdf', originalname: 'anleitung.pdf', mimetype: 'application/pdf', size: 1024 };
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

import productsRouter from '../routes/products';
import { prisma } from '../lib/prisma';
const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);
app.use(errorHandler);

const mockProduct = {
  id: 'prod-1',
  name: 'Hammer',
  description: null,
  imageUrl: null,
  barcode: null,
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('GET /api/products', () => {
  it('gibt alle Produkte zurück', async () => {
    mockPrisma.product.findMany.mockResolvedValue([{ ...mockProduct, _count: { instances: 2 } }]);

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Hammer');
  });
});

describe('GET /api/products/search', () => {
  it('gibt Suchergebnisse zurück', async () => {
    mockPrisma.product.findMany.mockResolvedValue([mockProduct]);

    const res = await request(app).get('/api/products/search?q=Hammer');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('gibt 400 zurück wenn q fehlt', async () => {
    const res = await request(app).get('/api/products/search');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/products/:id', () => {
  it('gibt Produkt zurück', async () => {
    mockPrisma.product.findFirst.mockResolvedValue({ ...mockProduct, documents: [], instances: [] });

    const res = await request(app).get('/api/products/prod-1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('prod-1');
  });

  it('gibt 404 zurück wenn nicht gefunden', async () => {
    mockPrisma.product.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/api/products/nonexistent');

    expect(res.status).toBe(404);
  });
});

describe('POST /api/products', () => {
  it('erstellt ein Produkt und antwortet 201', async () => {
    mockPrisma.tag.findMany.mockResolvedValue([]);
    mockPrisma.product.create.mockResolvedValue(mockProduct);

    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Hammer' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Hammer');
  });

  it('gibt 400 zurück bei fehlendem name', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/products/:id', () => {
  it('aktualisiert ein Produkt', async () => {
    mockPrisma.product.findFirst.mockResolvedValue(mockProduct);
    mockPrisma.tag.findMany.mockResolvedValue([]);
    mockPrisma.product.update.mockResolvedValue({ ...mockProduct, name: 'Schraubenzieher' });

    const res = await request(app)
      .put('/api/products/prod-1')
      .send({ name: 'Schraubenzieher' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Schraubenzieher');
  });

  it('wandelt leere productUrl in null um', async () => {
    mockPrisma.product.findFirst.mockResolvedValue(mockProduct);
    mockPrisma.tag.findMany.mockResolvedValue([]);
    mockPrisma.product.update.mockResolvedValue(mockProduct);

    await request(app)
      .put('/api/products/prod-1')
      .send({ productUrl: '' });

    expect(mockPrisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ productUrl: null }) }),
    );
  });

  it('gibt 404 zurück wenn nicht gefunden', async () => {
    mockPrisma.product.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/products/nonexistent')
      .send({ name: 'Test' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/products/:id', () => {
  it('löscht ein Produkt und antwortet 204', async () => {
    mockPrisma.product.findFirst.mockResolvedValue(mockProduct);
    mockPrisma.product.delete.mockResolvedValue(mockProduct);

    const res = await request(app).delete('/api/products/prod-1');

    expect(res.status).toBe(204);
  });

  it('gibt 404 zurück wenn nicht gefunden', async () => {
    mockPrisma.product.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/products/nonexistent');

    expect(res.status).toBe(404);
  });
});

describe('POST /api/products/:id/documents', () => {
  it('lädt ein Dokument hoch und antwortet 201', async () => {
    mockPrisma.product.findFirst.mockResolvedValue(mockProduct);
    mockPrisma.productDocument.create.mockResolvedValue({ id: 'doc-1', productId: 'prod-1', originalName: 'anleitung.pdf', url: '/uploads/abc.pdf' });

    const res = await request(app)
      .post('/api/products/prod-1/documents')
      .attach('document', Buffer.from('pdf'), { filename: 'anleitung.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
  });

  it('gibt 404 zurück wenn Produkt nicht gefunden', async () => {
    mockPrisma.product.findFirst.mockResolvedValue(null);

    const res = await request(app).post('/api/products/nonexistent/documents');

    expect(res.status).toBe(404);
  });
});
