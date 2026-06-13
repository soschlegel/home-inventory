/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    location: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    instance: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    product: {
      create: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
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

import locationsRouter from '../routes/locations';
import { prisma } from '../lib/prisma';
const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use('/api/locations', locationsRouter);
app.use(errorHandler);

const mockLocation = {
  id: 'loc-1',
  name: 'Kühlschrank',
  description: null,
  containerTypeId: null,
  roomId: 'room-1',
  parentId: null,
  room: { id: 'room-1', name: 'Küche' },
  parent: null,
  children: [],
  instances: [],
};

describe('GET /api/locations/:id', () => {
  it('gibt eine Location zurück', async () => {
    mockPrisma.location.findFirst.mockResolvedValue(mockLocation);

    const res = await request(app).get('/api/locations/loc-1');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Kühlschrank');
  });

  it('gibt 404 zurück wenn Location nicht existiert', async () => {
    mockPrisma.location.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/api/locations/nonexistent');

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/locations/:id', () => {
  it('aktualisiert Name einer Location', async () => {
    mockPrisma.location.findFirst.mockResolvedValue(mockLocation);
    mockPrisma.location.update.mockResolvedValue({ ...mockLocation, name: 'Gefrierfach' });

    const res = await request(app)
      .put('/api/locations/loc-1')
      .send({ name: 'Gefrierfach' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Gefrierfach');
  });

  it('gibt 404 zurück wenn Location nicht existiert', async () => {
    mockPrisma.location.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/locations/nonexistent')
      .send({ name: 'Gefrierfach' });

    expect(res.status).toBe(404);
  });

  it('gibt 400 zurück bei leerem name', async () => {
    mockPrisma.location.findFirst.mockResolvedValue(mockLocation);

    const res = await request(app)
      .put('/api/locations/loc-1')
      .send({ name: '' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/locations/:id', () => {
  it('löscht eine Location und antwortet 204', async () => {
    mockPrisma.location.findFirst.mockResolvedValue(mockLocation);
    mockPrisma.location.delete.mockResolvedValue(mockLocation);

    const res = await request(app).delete('/api/locations/loc-1');

    expect(res.status).toBe(204);
  });

  it('gibt 404 zurück wenn Location nicht gefunden', async () => {
    mockPrisma.location.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/locations/nonexistent');

    expect(res.status).toBe(404);
  });
});

describe('GET /api/locations/:locationId/instances', () => {
  it('gibt Instanzen einer Location zurück', async () => {
    mockPrisma.location.findFirst.mockResolvedValue(mockLocation);
    mockPrisma.instance.findMany.mockResolvedValue([
      { id: 'inst-1', productId: 'prod-1', product: { name: 'Milch' }, quantity: 2, locationId: 'loc-1', lendings: [] },
    ]);

    const res = await request(app).get('/api/locations/loc-1/instances');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].product.name).toBe('Milch');
  });

  it('gibt 404 zurück wenn Location nicht existiert', async () => {
    mockPrisma.location.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/api/locations/nonexistent/instances');

    expect(res.status).toBe(404);
  });
});

describe('POST /api/locations/:locationId/instances', () => {
  it('erstellt eine Instanz mit neuem Produkt und gibt 201 zurück', async () => {
    mockPrisma.location.findFirst.mockResolvedValue(mockLocation);
    mockPrisma.tag.findMany.mockResolvedValue([]);
    mockPrisma.product.create.mockResolvedValue({ id: 'prod-new', name: 'Butter' });
    mockPrisma.instance.create.mockResolvedValue({
      id: 'inst-new',
      productId: 'prod-new',
      product: { id: 'prod-new', name: 'Butter', imageUrl: null, tags: [] },
      quantity: 1,
      locationId: 'loc-1',
      lendings: [],
    });

    const res = await request(app)
      .post('/api/locations/loc-1/instances')
      .send({ name: 'Butter', quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.product.name).toBe('Butter');
  });

  it('erstellt eine Instanz mit bestehendem Produkt', async () => {
    mockPrisma.location.findFirst.mockResolvedValue(mockLocation);
    mockPrisma.instance.create.mockResolvedValue({
      id: 'inst-2',
      productId: 'prod-1',
      product: { id: 'prod-1', name: 'Hammer', imageUrl: null, tags: [] },
      quantity: 2,
      locationId: 'loc-1',
      lendings: [],
    });

    const res = await request(app)
      .post('/api/locations/loc-1/instances')
      .send({ productId: 'prod-1', quantity: 2 });

    expect(res.status).toBe(201);
  });

  it('gibt 400 zurück wenn weder name noch productId angegeben', async () => {
    mockPrisma.location.findFirst.mockResolvedValue(mockLocation);

    const res = await request(app)
      .post('/api/locations/loc-1/instances')
      .send({ quantity: 1 });

    expect(res.status).toBe(400);
  });
});
