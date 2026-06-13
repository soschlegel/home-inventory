import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const TagBody = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/),
  name: z.string().min(1).max(100),
});

// GET /api/tags
router.get('/', async (_req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      include: { _count: { select: { items: true } } },
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
    const data = TagBody.parse(req.body);
    const existing = await prisma.tag.findFirst({
      where: { OR: [{ key: data.key }, { name: data.name }] },
    });
    if (existing) { res.status(409).json({ error: 'Tag bereits vorhanden' }); return; }
    const tag = await prisma.tag.create({
      data,
      include: { _count: { select: { items: true } } },
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
    const data = TagBody.partial().parse(req.body);
    const tag = await prisma.tag.update({
      where: { id: req.params.id },
      data,
      include: { _count: { select: { items: true } } },
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
