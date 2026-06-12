/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    containerType: {
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

import containerTypesRouter from '../routes/containerTypes';
import { prisma } from '../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/container-types', containerTypesRouter);
app.use(errorHandler);

const mockType = {
  id: 'type-1',
  name: 'Schublade',
  icon: '🗄️',
  color: '#4F46E5',
  createdAt: new Date(),
  _count: { locations: 3 },
};

describe('GET /api/container-types', () => {
  it('gibt Liste aller Container-Typen zurück', async () => {
    vi.mocked(prisma.containerType.findMany).mockResolvedValue([mockType] as any);

    const res = await request(app).get('/api/container-types');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Schublade');
  });
});

describe('POST /api/container-types', () => {
  it('erstellt einen Container-Typ und gibt 201 zurück', async () => {
    vi.mocked(prisma.containerType.create).mockResolvedValue(mockType as any);

    const res = await request(app)
      .post('/api/container-types')
      .send({ name: 'Schublade', icon: '🗄️', color: '#4F46E5' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Schublade');
  });

  it('gibt 400 zurück bei fehlendem name', async () => {
    const res = await request(app).post('/api/container-types').send({});
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück bei ungültigem Hex-Farbwert', async () => {
    const res = await request(app)
      .post('/api/container-types')
      .send({ name: 'Schublade', color: 'rot' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/container-types/:id', () => {
  it('aktualisiert einen Container-Typ', async () => {
    vi.mocked(prisma.containerType.findFirst).mockResolvedValue(mockType as any);
    vi.mocked(prisma.containerType.update).mockResolvedValue({ ...mockType, name: 'Regal' } as any);

    const res = await request(app)
      .put('/api/container-types/type-1')
      .send({ name: 'Regal' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Regal');
  });

  it('gibt 404 zurück wenn Typ nicht gefunden', async () => {
    vi.mocked(prisma.containerType.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/container-types/nonexistent')
      .send({ name: 'Regal' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/container-types/:id', () => {
  it('löscht einen Container-Typ und antwortet 204', async () => {
    vi.mocked(prisma.containerType.findFirst).mockResolvedValue(mockType as any);
    vi.mocked(prisma.containerType.delete).mockResolvedValue(mockType as any);

    const res = await request(app).delete('/api/container-types/type-1');

    expect(res.status).toBe(204);
  });

  it('gibt 404 zurück wenn Typ nicht gefunden', async () => {
    vi.mocked(prisma.containerType.findFirst).mockResolvedValue(null);

    const res = await request(app).delete('/api/container-types/nonexistent');

    expect(res.status).toBe(404);
  });
});
