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
      findMany: vi.fn(),
    },
    item: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
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
  items: [],
};

describe('GET /api/locations/:id', () => {
  it('gibt eine Location zurück', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValue(mockLocation as any);

    const res = await request(app).get('/api/locations/loc-1');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Kühlschrank');
  });

  it('gibt 404 zurück wenn Location nicht existiert', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValue(null);

    const res = await request(app).get('/api/locations/nonexistent');

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/locations/:id', () => {
  it('aktualisiert Name einer Location', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValue(mockLocation as any);
    vi.mocked(prisma.location.update).mockResolvedValue({
      ...mockLocation,
      name: 'Gefrierfach',
    } as any);

    const res = await request(app)
      .put('/api/locations/loc-1')
      .send({ name: 'Gefrierfach' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Gefrierfach');
    expect(prisma.location.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: 'Gefrierfach' }) }),
    );
  });

  it('aktualisiert Container-Typ einer Location', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValue(mockLocation as any);
    vi.mocked(prisma.location.update).mockResolvedValue({
      ...mockLocation,
      containerTypeId: 'ct-1',
    } as any);

    const res = await request(app)
      .put('/api/locations/loc-1')
      .send({ containerTypeId: 'ct-1' });

    expect(res.status).toBe(200);
  });

  it('gibt 404 zurück wenn Location nicht existiert', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/locations/nonexistent')
      .send({ name: 'Gefrierfach' });

    expect(res.status).toBe(404);
  });

  it('gibt 400 zurück bei leerem name', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValue(mockLocation as any);

    const res = await request(app)
      .put('/api/locations/loc-1')
      .send({ name: '' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/locations/:id', () => {
  it('löscht eine Location und antwortet 204', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValue(mockLocation as any);
    vi.mocked(prisma.location.delete).mockResolvedValue(mockLocation as any);

    const res = await request(app).delete('/api/locations/loc-1');

    expect(res.status).toBe(204);
    expect(prisma.location.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'loc-1' } }),
    );
  });

  it('gibt 404 zurück wenn Location nicht gefunden', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValue(null);

    const res = await request(app).delete('/api/locations/nonexistent');

    expect(res.status).toBe(404);
  });
});

describe('GET /api/locations/:locationId/items', () => {
  it('gibt Items einer Location zurück', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValue(mockLocation as any);
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      { id: 'item-1', name: 'Milch', quantity: 2, locationId: 'loc-1', tags: [] },
    ] as any);

    const res = await request(app).get('/api/locations/loc-1/items');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Milch');
  });

  it('gibt 404 zurück wenn Location nicht existiert', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValue(null);

    const res = await request(app).get('/api/locations/nonexistent/items');

    expect(res.status).toBe(404);
  });
});

describe('POST /api/locations/:locationId/items', () => {
  it('erstellt ein Item und gibt 201 zurück', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValue(mockLocation as any);
    vi.mocked(prisma.item.create).mockResolvedValue({
      id: 'item-2',
      name: 'Butter',
      quantity: 1,
      locationId: 'loc-1',
      tags: [],
    } as any);

    const res = await request(app)
      .post('/api/locations/loc-1/items')
      .send({ name: 'Butter', quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Butter');
  });

  it('gibt 400 zurück bei fehlendem name', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValue(mockLocation as any);

    const res = await request(app)
      .post('/api/locations/loc-1/items')
      .send({ quantity: 1 });

    expect(res.status).toBe(400);
  });
});
