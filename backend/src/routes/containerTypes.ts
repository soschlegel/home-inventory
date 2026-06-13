import { Router } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const translationsSchema = z
  .record(z.string().min(2).max(10), z.string().min(1).max(200))
  .nullable()
  .optional();

const ContainerTypeCreateBody = z.object({
  name: z.string().min(1).max(50),
  translations: translationsSchema,
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const ContainerTypeUpdateBody = z.object({
  name: z.string().min(1).max(50).optional(),
  translations: translationsSchema,
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// GET /api/container-types
router.get('/', async (_req, res, next) => {
  try {
    const types = await prisma.containerType.findMany({
      include: { _count: { select: { locations: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(types);
  } catch (err) {
    next(err);
  }
});

// POST /api/container-types
router.post('/', requireEditor, async (req, res, next) => {
  try {
    const data = ContainerTypeCreateBody.parse(req.body);
    const type = await prisma.containerType.create({ data: { ...data, key: randomUUID() } });
    res.status(201).json(type);
  } catch (err) {
    next(err);
  }
});

// PUT /api/container-types/:id
router.put('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.containerType.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Container-Typ nicht gefunden' }); return; }
    const data = ContainerTypeUpdateBody.parse(req.body);
    const type = await prisma.containerType.update({ where: { id: req.params.id }, data });
    res.json(type);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/container-types/:id
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.containerType.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Container-Typ nicht gefunden' }); return; }
    await prisma.containerType.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
