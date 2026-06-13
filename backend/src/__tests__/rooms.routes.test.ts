/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    room: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    location: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// authenticate überspringen und userId injizieren
vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'test-user-id';
    req.userRole = 'EDITOR';
    next();
  },
  requireEditor: (_req: any, _res: any, next: any) => next(),
}));

import roomsRouter from '../routes/rooms';
import { prisma } from '../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);
app.use(errorHandler);

const mockRoom = {
  id: 'room-1',
  name: 'Wohnzimmer',
  translations: { de: 'Wohnzimmer', en: 'Living Room' },
  description: null,
  icon: null,
  _count: { locations: 2 },
};

describe('GET /api/rooms', () => {
  it('gibt Liste aller Räume zurück', async () => {
    vi.mocked(prisma.room.findMany).mockResolvedValue([mockRoom] as any);

    const res = await request(app).get('/api/rooms');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Wohnzimmer');
    expect(res.body[0].translations).toEqual({ de: 'Wohnzimmer', en: 'Living Room' });
  });
});

describe('POST /api/rooms', () => {
  it('erstellt einen Raum und gibt 201 zurück', async () => {
    vi.mocked(prisma.room.create).mockResolvedValue(mockRoom as any);

    const res = await request(app)
      .post('/api/rooms')
      .send({ name: 'Wohnzimmer' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Wohnzimmer');
    expect(prisma.room.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: 'Wohnzimmer' }) }),
    );
  });

  it('erstellt einen Raum mit Übersetzungen', async () => {
    vi.mocked(prisma.room.create).mockResolvedValue(mockRoom as any);

    const res = await request(app)
      .post('/api/rooms')
      .send({ name: 'Wohnzimmer', translations: { de: 'Wohnzimmer', en: 'Living Room' } });

    expect(res.status).toBe(201);
  });

  it('gibt 400 zurück bei fehlendem name', async () => {
    const res = await request(app).post('/api/rooms').send({});
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück bei leerem name', async () => {
    const res = await request(app).post('/api/rooms').send({ name: '' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/rooms/:id', () => {
  it('aktualisiert einen Raum', async () => {
    vi.mocked(prisma.room.findFirst).mockResolvedValue(mockRoom as any);
    vi.mocked(prisma.room.update).mockResolvedValue({ ...mockRoom, name: 'Küche' } as any);

    const res = await request(app)
      .put('/api/rooms/room-1')
      .send({ name: 'Küche' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Küche');
  });

  it('aktualisiert Übersetzungen und unterstützt zusätzliche Sprachen', async () => {
    const updated = { ...mockRoom, translations: { de: 'Wohnzimmer', en: 'Living Room', fr: 'Salon' } };
    vi.mocked(prisma.room.findFirst).mockResolvedValue(mockRoom as any);
    vi.mocked(prisma.room.update).mockResolvedValue(updated as any);

    const res = await request(app)
      .put('/api/rooms/room-1')
      .send({ translations: { de: 'Wohnzimmer', en: 'Living Room', fr: 'Salon' } });

    expect(res.status).toBe(200);
    expect(res.body.translations.fr).toBe('Salon');
  });

  it('gibt 404 zurück wenn Raum nicht existiert', async () => {
    vi.mocked(prisma.room.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/rooms/nonexistent')
      .send({ name: 'Küche' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/rooms/:id', () => {
  it('löscht einen Raum und antwortet 204', async () => {
    vi.mocked(prisma.room.findFirst).mockResolvedValue(mockRoom as any);
    vi.mocked(prisma.room.delete).mockResolvedValue(mockRoom as any);

    const res = await request(app).delete('/api/rooms/room-1');

    expect(res.status).toBe(204);
  });

  it('gibt 404 zurück wenn Raum nicht gefunden', async () => {
    vi.mocked(prisma.room.findFirst).mockResolvedValue(null);

    const res = await request(app).delete('/api/rooms/nonexistent');

    expect(res.status).toBe(404);
  });
});
