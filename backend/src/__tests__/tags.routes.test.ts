/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    tag: {
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

import tagsRouter from '../routes/tags';
import { prisma } from '../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/tags', tagsRouter);
app.use(errorHandler);

const mockTag = { id: 'tag-1', key: 'electronics', name: 'Elektronik', createdAt: new Date(), _count: { items: 3 } };

describe('GET /api/tags', () => {
  it('gibt alle Tags mit Item-Count zurück', async () => {
    vi.mocked(prisma.tag.findMany).mockResolvedValue([mockTag] as any);

    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].key).toBe('electronics');
    expect(res.body[0]._count.items).toBe(3);
  });

  it('gibt leere Liste zurück wenn keine Tags vorhanden', async () => {
    vi.mocked(prisma.tag.findMany).mockResolvedValue([]);

    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('POST /api/tags', () => {
  it('erstellt einen neuen Tag', async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.tag.create).mockResolvedValue(mockTag as any);

    const res = await request(app)
      .post('/api/tags')
      .send({ key: 'electronics', name: 'Elektronik' });

    expect(res.status).toBe(201);
    expect(res.body.key).toBe('electronics');
  });

  it('gibt 409 zurück wenn Tag bereits vorhanden', async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue(mockTag as any);

    const res = await request(app)
      .post('/api/tags')
      .send({ key: 'electronics', name: 'Elektronik' });

    expect(res.status).toBe(409);
  });

  it('gibt 400 zurück bei ungültigem Key-Format', async () => {
    const res = await request(app)
      .post('/api/tags')
      .send({ key: 'Elektronik!', name: 'Elektronik' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/tags/:id', () => {
  it('aktualisiert einen Tag', async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue(mockTag as any);
    vi.mocked(prisma.tag.update).mockResolvedValue({ ...mockTag, name: 'Elektronik (aktualisiert)' } as any);

    const res = await request(app)
      .put('/api/tags/tag-1')
      .send({ name: 'Elektronik (aktualisiert)' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Elektronik (aktualisiert)');
  });

  it('gibt 404 zurück wenn Tag nicht gefunden', async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/tags/nonexistent')
      .send({ name: 'Neuer Name' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/tags/:id', () => {
  it('löscht einen Tag und antwortet 204', async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue(mockTag as any);
    vi.mocked(prisma.tag.delete).mockResolvedValue(mockTag as any);

    const res = await request(app).delete('/api/tags/tag-1');

    expect(res.status).toBe(204);
  });

  it('gibt 404 zurück wenn Tag nicht gefunden', async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue(null);

    const res = await request(app).delete('/api/tags/nonexistent');

    expect(res.status).toBe(404);
  });
});
