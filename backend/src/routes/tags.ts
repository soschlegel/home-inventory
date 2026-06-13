import { Router } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';

function jsonField(v: Record<string, string> | null | undefined) {
  return v === null ? Prisma.JsonNull : v;
}

const router = Router();
router.use(authenticate);

const translationsSchema = z
  .record(z.string().min(2).max(10), z.string().min(1).max(200))
  .nullable()
  .optional();

const TagCreateBody = z.object({
  name: z.string().min(1).max(100),
  translations: translationsSchema,
});

const TagUpdateBody = z.object({
  name: z.string().min(1).max(100).optional(),
  translations: translationsSchema,
});

// GET /api/tags
router.get('/', async (_req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(tags);
  } catch (err) {
    next(err);
  }
});

// POST /api/tags
router.post('/', requireEditor, async (req, res, next) => {
  try {
    const { translations, ...rest } = TagCreateBody.parse(req.body);
    const existing = await prisma.tag.findFirst({ where: { name: rest.name } });
    if (existing) { res.status(409).json({ error: 'Tag bereits vorhanden' }); return; }
    const tag = await prisma.tag.create({
      data: { ...rest, key: randomUUID(), translations: jsonField(translations) },
      include: { _count: { select: { products: true } } },
    });
    res.status(201).json(tag);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tags/:id
router.put('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.tag.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Tag nicht gefunden' }); return; }
    const { translations, ...rest } = TagUpdateBody.parse(req.body);
    const tag = await prisma.tag.update({
      where: { id: req.params.id },
      data: { ...rest, ...(translations !== undefined ? { translations: jsonField(translations) } : {}) },
      include: { _count: { select: { products: true } } },
    });
    res.json(tag);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tags/:id
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.tag.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Tag nicht gefunden' }); return; }
    await prisma.tag.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
