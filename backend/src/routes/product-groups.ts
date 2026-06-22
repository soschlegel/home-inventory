import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const ProductGroupBody = z.object({
  name: z.string().min(1).max(200),
  minQuantity: z.coerce.number().nonnegative().nullable().optional(),
});

// GET /api/product-groups
router.get('/', async (_req, res, next) => {
  try {
    const groups = await prisma.productGroup.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(groups);
  } catch (err) { next(err); }
});

// GET /api/product-groups/:id
router.get('/:id', async (req, res, next) => {
  try {
    const group = await prisma.productGroup.findFirst({
      where: { id: req.params.id },
      include: {
        products: {
          select: { id: true, name: true, imageUrl: true, unit: true, minQuantity: true },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!group) { res.status(404).json({ error: 'Gruppe nicht gefunden' }); return; }
    res.json(group);
  } catch (err) { next(err); }
});

// POST /api/product-groups
router.post('/', requireEditor, async (req, res, next) => {
  try {
    const data = ProductGroupBody.parse(req.body);
    const group = await prisma.productGroup.create({
      data,
      include: { _count: { select: { products: true } } },
    });
    res.status(201).json(group);
  } catch (err) { next(err); }
});

// PUT /api/product-groups/:id
router.put('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.productGroup.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Gruppe nicht gefunden' }); return; }
    const data = ProductGroupBody.partial().parse(req.body);
    const group = await prisma.productGroup.update({
      where: { id: req.params.id },
      data: { ...data, minQuantity: data.minQuantity ?? null },
      include: { _count: { select: { products: true } } },
    });
    res.json(group);
  } catch (err) { next(err); }
});

// DELETE /api/product-groups/:id
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.productGroup.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Gruppe nicht gefunden' }); return; }
    await prisma.productGroup.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
