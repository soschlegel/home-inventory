import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../lib/prisma', () => ({
  prisma: {
    tag: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
}));

import tagsRouter from '../routes/tags';
import { prisma } from '../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/tags', tagsRouter);
app.use(errorHandler);

describe('GET /api/tags', () => {
  it('gibt alle verwendeten Tags zurück', async () => {
    const mockTags = [
      { id: 'tag-1', name: 'Elektronik', _count: { items: 5 } },
      { id: 'tag-2', name: 'Werkzeug', _count: { items: 3 } },
    ];
    vi.mocked(prisma.tag.findMany).mockResolvedValue(mockTags as any);

    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe('Elektronik');
    expect(res.body[0]._count.items).toBe(5);
  });

  it('gibt leere Liste zurück wenn keine Tags vorhanden', async () => {
    vi.mocked(prisma.tag.findMany).mockResolvedValue([]);

    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});
