/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    unit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
  requireEditor: (_req: any, _res: any, next: any) => next(),
}));

import unitsRouter from '../routes/units';
import { prisma } from '../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/units', unitsRouter);
app.use(errorHandler);

const mockUnit = {
  id: 'unit-1',
  key: 'piece',
  name: 'Stück',
  translations: { de: 'Stück', en: 'piece' },
  createdAt: new Date(),
};

describe('GET /api/units', () => {
  it('gibt alle Einheiten zurück', async () => {
    vi.mocked(prisma.unit.findMany).mockResolvedValue([mockUnit] as any);

    const res = await request(app).get('/api/units');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].key).toBe('piece');
    expect(res.body[0].name).toBe('Stück');
    expect(res.body[0].translations).toEqual({ de: 'Stück', en: 'piece' });
  });
});

describe('POST /api/units', () => {
  it('erstellt eine neue Einheit mit key und name', async () => {
    vi.mocked(prisma.unit.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.unit.create).mockResolvedValue(mockUnit as any);

    const res = await request(app)
      .post('/api/units')
      .send({ key: 'piece', name: 'Stück' });

    expect(res.status).toBe(201);
    expect(res.body.key).toBe('piece');
  });

  it('erstellt eine Einheit mit Übersetzungen', async () => {
    vi.mocked(prisma.unit.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.unit.create).mockResolvedValue(mockUnit as any);

    const res = await request(app)
      .post('/api/units')
      .send({ key: 'piece', name: 'Stück', translations: { de: 'Stück', en: 'piece' } });

    expect(res.status).toBe(201);
  });

  it('gibt 409 zurück wenn Einheit bereits vorhanden', async () => {
    vi.mocked(prisma.unit.findFirst).mockResolvedValue(mockUnit as any);

    const res = await request(app)
      .post('/api/units')
      .send({ key: 'piece', name: 'Stück' });

    expect(res.status).toBe(409);
  });

  it('gibt 400 zurück wenn key fehlt', async () => {
    const res = await request(app)
      .post('/api/units')
      .send({ name: 'Stück' });

    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück bei ungültigem key-Format', async () => {
    const res = await request(app)
      .post('/api/units')
      .send({ key: 'Stück!', name: 'Stück' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/units/:id', () => {
  it('aktualisiert den Namen einer Einheit', async () => {
    vi.mocked(prisma.unit.findFirst)
      .mockResolvedValueOnce(mockUnit as any)  // find existing
      .mockResolvedValueOnce(null);            // no name conflict
    vi.mocked(prisma.unit.update).mockResolvedValue({ ...mockUnit, name: 'Stücke' } as any);

    const res = await request(app)
      .put('/api/units/unit-1')
      .send({ name: 'Stücke' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Stücke');
  });

  it('aktualisiert Übersetzungen einer Einheit', async () => {
    const updated = { ...mockUnit, translations: { de: 'Stück', en: 'piece', fr: 'pièce' } };
    vi.mocked(prisma.unit.findFirst).mockResolvedValue(mockUnit as any);
    vi.mocked(prisma.unit.update).mockResolvedValue(updated as any);

    const res = await request(app)
      .put('/api/units/unit-1')
      .send({ translations: { de: 'Stück', en: 'piece', fr: 'pièce' } });

    expect(res.status).toBe(200);
    expect(res.body.translations.fr).toBe('pièce');
  });

  it('gibt 404 zurück wenn Einheit nicht gefunden', async () => {
    vi.mocked(prisma.unit.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/units/nonexistent')
      .send({ name: 'Test' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/units/:id', () => {
  it('löscht eine Einheit und antwortet 204', async () => {
    vi.mocked(prisma.unit.findFirst).mockResolvedValue(mockUnit as any);
    vi.mocked(prisma.unit.delete).mockResolvedValue(mockUnit as any);

    const res = await request(app).delete('/api/units/unit-1');

    expect(res.status).toBe(204);
  });

  it('gibt 404 zurück wenn Einheit nicht gefunden', async () => {
    vi.mocked(prisma.unit.findFirst).mockResolvedValue(null);

    const res = await request(app).delete('/api/units/nonexistent');

    expect(res.status).toBe(404);
  });
});
