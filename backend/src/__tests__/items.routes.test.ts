/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
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
      findMany: vi.fn(),
    },
    itemDocument: {
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

import itemsRouter from '../routes/items';
import { prisma } from '../lib/prisma';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

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

describe('GET /api/items', () => {
  it('gibt alle Items mit Location-Info zurück', async () => {
    const itemWithLocation = {
      ...mockItem,
      location: {
        id: 'loc-1',
        name: 'Kühlschrank',
        room: { id: 'room-1', name: 'Küche' },
        parent: null,
      },
      _count: { lendings: 0 },
    };
    vi.mocked(prisma.item.findMany).mockResolvedValue([itemWithLocation] as any);

    const res = await request(app).get('/api/items');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Hammer');
    expect(res.body[0].location.room.name).toBe('Küche');
    expect(res.body[0]._count.lendings).toBe(0);
  });

  it('gibt aktive Ausleihen im _count mit', async () => {
    const lentItem = {
      ...mockItem,
      location: {
        id: 'loc-1',
        name: 'Schrank',
        room: { id: 'room-1', name: 'Wohnzimmer' },
        parent: null,
      },
      _count: { lendings: 1 },
    };
    vi.mocked(prisma.item.findMany).mockResolvedValue([lentItem] as any);

    const res = await request(app).get('/api/items');

    expect(res.status).toBe(200);
    expect(res.body[0]._count.lendings).toBe(1);
  });
});

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

describe('GET /api/items/expiring-soon', () => {
  it('gibt Items zurück die innerhalb des Warnfensters ablaufen', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 5);
    const expiringItem = { ...mockItem, expiryDate: soon, expiryWarningDays: 30 };
    vi.mocked(prisma.item.findMany).mockResolvedValue([expiringItem] as any);

    const res = await request(app).get('/api/items/expiring-soon');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('gibt leere Liste zurück wenn kein Item ablaufend ist', async () => {
    const far = new Date();
    far.setFullYear(far.getFullYear() + 2);
    const okItem = { ...mockItem, expiryDate: far, expiryWarningDays: 30 };
    vi.mocked(prisma.item.findMany).mockResolvedValue([okItem] as any);

    const res = await request(app).get('/api/items/expiring-soon');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('berücksichtigt bereits abgelaufene Items', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const expiredItem = { ...mockItem, expiryDate: past, expiryWarningDays: 30 };
    vi.mocked(prisma.item.findMany).mockResolvedValue([expiredItem] as any);

    const res = await request(app).get('/api/items/expiring-soon');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('POST /api/items/:id/documents', () => {
  const mockDoc = {
    id: 'doc-1',
    itemId: 'item-1',
    originalName: 'rechnung.pdf',
    url: '/uploads/abc.pdf',
    mimeType: 'application/pdf',
    size: 12345,
    createdAt: new Date(),
  };

  it('erstellt ein Dokument und antwortet 201', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(mockItem as any);
    mockPrisma.itemDocument.create.mockResolvedValue(mockDoc);

    const res = await request(app)
      .post('/api/items/item-1/documents')
      .attach('document', Buffer.from('pdf content'), { filename: 'rechnung.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
  });

  it('gibt 404 zurück wenn Item nicht gefunden', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    const res = await request(app).post('/api/items/nonexistent/documents');

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/items/:id/documents/:docId', () => {
  const mockDoc = {
    id: 'doc-1',
    itemId: 'item-1',
    originalName: 'rechnung.pdf',
    url: '/uploads/abc.pdf',
    mimeType: 'application/pdf',
    size: 12345,
    createdAt: new Date(),
  };

  it('löscht ein Dokument und antwortet 204', async () => {
    mockPrisma.itemDocument.findFirst.mockResolvedValue(mockDoc);
    mockPrisma.itemDocument.delete.mockResolvedValue(mockDoc);

    const res = await request(app).delete('/api/items/item-1/documents/doc-1');

    expect(res.status).toBe(204);
  });

  it('gibt 404 zurück wenn Dokument nicht gefunden', async () => {
    mockPrisma.itemDocument.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/items/item-1/documents/nonexistent');

    expect(res.status).toBe(404);
  });
});
