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
    item: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    itemTag: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
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
  items: [],
  itemTags: [],
  lendings: [],
};

describe('GET /api/admin/export', () => {
  beforeEach(() => {
    vi.mocked(prisma.unit.findMany).mockResolvedValue(mockExportData.units as any);
    vi.mocked(prisma.tag.findMany).mockResolvedValue(mockExportData.tags as any);
    vi.mocked(prisma.containerType.findMany).mockResolvedValue([]);
    vi.mocked(prisma.room.findMany).mockResolvedValue(mockExportData.rooms as any);
    vi.mocked(prisma.location.findMany).mockResolvedValue(mockExportData.locations as any);
    vi.mocked(prisma.item.findMany).mockResolvedValue([]);
    vi.mocked(prisma.itemTag.findMany).mockResolvedValue([]);
    vi.mocked(prisma.lending.findMany).mockResolvedValue([]);
  });

  it('gibt 200 mit korrekter Struktur zurück', async () => {
    const res = await request(app).get('/api/admin/export');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('version', '1.0');
    expect(res.body).toHaveProperty('exportedAt');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('units');
    expect(res.body.data).toHaveProperty('tags');
    expect(res.body.data).toHaveProperty('rooms');
    expect(res.body.data).toHaveProperty('locations');
    expect(res.body.data).toHaveProperty('items');
    expect(res.body.data).toHaveProperty('itemTags');
    expect(res.body.data).toHaveProperty('lendings');
  });

  it('setzt Content-Disposition Header', async () => {
    const res = await request(app).get('/api/admin/export');

    expect(res.headers['content-disposition']).toMatch(/attachment; filename="home-inventory-backup-.+\.json"/);
  });

  it('enthält keine passwordHash-Felder', async () => {
    const res = await request(app).get('/api/admin/export');

    expect(res.body.data).not.toHaveProperty('users');
  });
});

const validImportPayload = {
  version: '1.0',
  data: {
    units: [{ id: 'u1', key: 'piece', name: 'Stück', createdAt: '2026-01-01T00:00:00.000Z' }],
    tags: [],
    containerTypes: [],
    rooms: [{ id: 'r1', name: 'Wohnzimmer', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
    locations: [
      { id: 'l1', name: 'Schrank', roomId: 'r1', parentId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'l2', name: 'Fach', roomId: 'r1', parentId: 'l1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
    ],
    items: [],
    itemTags: [],
    lendings: [],
  },
};

describe('POST /api/admin/import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(prisma));
    vi.mocked(prisma.lending.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.itemTag.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.item.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.location.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.location.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.room.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.containerType.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.tag.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.unit.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.unit.createMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.room.createMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.location.create).mockResolvedValue({} as any);
  });

  it('gibt 200 und Erfolgsmeldung zurück', async () => {
    const res = await request(app).post('/api/admin/import').send(validImportPayload);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Import erfolgreich');
    expect(res.body).toHaveProperty('importedAt');
  });

  it('fügt Locations in topologischer Reihenfolge ein (Eltern vor Kindern)', async () => {
    await request(app).post('/api/admin/import').send(validImportPayload);

    const calls = vi.mocked(prisma.location.create).mock.calls;
    expect(calls).toHaveLength(2);
    expect((calls[0][0] as any).data.id).toBe('l1');
    expect((calls[1][0] as any).data.id).toBe('l2');
  });

  it('gibt 400 bei fehlendem version-Feld zurück', async () => {
    const res = await request(app)
      .post('/api/admin/import')
      .send({ data: validImportPayload.data });

    expect(res.status).toBe(400);
  });

  it('gibt 400 bei falscher Struktur zurück', async () => {
    const res = await request(app)
      .post('/api/admin/import')
      .send({ version: '1.0', data: { units: 'kein-array' } });

    expect(res.status).toBe(400);
  });

  it('gibt 400 bei ungültigem Item-Condition-Wert zurück', async () => {
    const payload = {
      ...validImportPayload,
      data: {
        ...validImportPayload.data,
        items: [{ id: 'i1', name: 'Test', locationId: 'l1', condition: 'UNGUELTIG', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      },
    };
    const res = await request(app).post('/api/admin/import').send(payload);

    expect(res.status).toBe(400);
  });
});
