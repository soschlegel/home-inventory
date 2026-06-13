/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    unit: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    tag: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    containerType: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    room: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    location: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    product: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    productTag: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    productDocument: { deleteMany: vi.fn() },
    instance: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    instanceDocument: { deleteMany: vi.fn() },
    lending: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'editor-id';
    req.userRole = 'EDITOR';
    next();
  },
  requireEditor: (_req: any, _res: any, next: any) => next(),
}));

import adminRouter from '../routes/admin';
import { prisma } from '../lib/prisma';
const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use('/api/admin', adminRouter);
app.use(errorHandler);

const mockExportData = {
  units: [{ id: 'u1', key: 'piece', name: 'Stück', createdAt: new Date() }],
  tags: [{ id: 't1', key: 'tool', name: 'Werkzeug', createdAt: new Date() }],
  containerTypes: [],
  rooms: [{ id: 'r1', name: 'Wohnzimmer', description: null, icon: null, createdAt: new Date(), updatedAt: new Date() }],
  locations: [{ id: 'l1', name: 'Schrank', description: null, containerTypeId: null, roomId: 'r1', parentId: null, createdAt: new Date(), updatedAt: new Date() }],
  products: [],
  productTags: [],
  instances: [],
  lendings: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/admin/export', () => {
  it('exportiert alle Daten als JSON', async () => {
    mockPrisma.unit.findMany.mockResolvedValue(mockExportData.units);
    mockPrisma.tag.findMany.mockResolvedValue(mockExportData.tags);
    mockPrisma.containerType.findMany.mockResolvedValue([]);
    mockPrisma.room.findMany.mockResolvedValue(mockExportData.rooms);
    mockPrisma.location.findMany.mockResolvedValue(mockExportData.locations);
    mockPrisma.product.findMany.mockResolvedValue([]);
    mockPrisma.productTag.findMany.mockResolvedValue([]);
    mockPrisma.instance.findMany.mockResolvedValue([]);
    mockPrisma.lending.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/admin/export');

    expect(res.status).toBe(200);
    expect(res.body.version).toBe('2.0');
    expect(res.body.data.units).toHaveLength(1);
    expect(res.body.data.products).toHaveLength(0);
  });
});

describe('POST /api/admin/import', () => {
  it('importiert Daten und gibt Erfolgsmeldung zurück', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      await fn({
        lending: { deleteMany: vi.fn() },
        instanceDocument: { deleteMany: vi.fn() },
        instance: { deleteMany: vi.fn() },
        productDocument: { deleteMany: vi.fn() },
        productTag: { deleteMany: vi.fn() },
        product: { deleteMany: vi.fn() },
        location: { updateMany: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
        room: { deleteMany: vi.fn(), createMany: vi.fn() },
        containerType: { deleteMany: vi.fn(), createMany: vi.fn() },
        tag: { deleteMany: vi.fn(), createMany: vi.fn() },
        unit: { deleteMany: vi.fn(), createMany: vi.fn() },
      });
    });

    const importPayload = {
      version: '2.0',
      data: {
        units: [{ id: 'u1', key: 'piece', name: 'Stück', createdAt: new Date().toISOString() }],
        tags: [],
        containerTypes: [],
        rooms: [],
        locations: [],
        products: [],
        productTags: [],
        instances: [],
        lendings: [],
      },
    };

    const res = await request(app)
      .post('/api/admin/import')
      .send(importPayload);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Import erfolgreich');
  });

  it('gibt 400 zurück bei ungültigem Format', async () => {
    const res = await request(app)
      .post('/api/admin/import')
      .send({ version: '2.0', data: {} });

    expect(res.status).toBe(400);
  });
});
