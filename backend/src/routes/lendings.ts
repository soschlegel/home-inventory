import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const LendBody = z.object({
  lentTo: z.string().min(1),
  lentAt: z.coerce.date().optional(),
  note: z.string().optional(),
});

// GET /api/lendings/active
router.get('/active', async (_req, res, next) => {
  try {
    const lendings = await prisma.lending.findMany({
      where: { returnedAt: null },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            location: { include: { room: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { lentAt: 'desc' },
    });
    res.json(lendings);
  } catch (err) {
    next(err);
  }
});

// GET /api/lendings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const lending = await prisma.lending.findFirst({
      where: { id: req.params.id },
      include: { item: { select: { id: true, name: true } } },
    });
    if (!lending) { res.status(404).json({ error: 'Ausleihe nicht gefunden' }); return; }
    res.json(lending);
  } catch (err) {
    next(err);
  }
});

// POST /api/items/:itemId/lend
router.post('/items/:itemId/lend', requireEditor, async (req, res, next) => {
  try {
    const item = await prisma.item.findFirst({ where: { id: req.params.itemId } });
    if (!item) { res.status(404).json({ error: 'Gegenstand nicht gefunden' }); return; }
    const data = LendBody.parse(req.body);
    const lending = await prisma.lending.create({
      data: { ...data, itemId: req.params.itemId },
    });
    res.status(201).json(lending);
  } catch (err) {
    next(err);
  }
});

// PUT /api/lendings/:id/return
router.put('/:id/return', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.lending.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Ausleihe nicht gefunden' }); return; }
    if (existing.returnedAt) {
      res.status(409).json({ error: 'Gegenstand wurde bereits zurückgegeben' });
      return;
    }
    const lending = await prisma.lending.update({
      where: { id: req.params.id },
      data: { returnedAt: new Date() },
    });
    res.json(lending);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:itemId/lendings
router.get('/items/:itemId/lendings', async (req, res, next) => {
  try {
    const item = await prisma.item.findFirst({ where: { id: req.params.itemId } });
    if (!item) { res.status(404).json({ error: 'Gegenstand nicht gefunden' }); return; }
    const lendings = await prisma.lending.findMany({
      where: { itemId: req.params.itemId },
      orderBy: { lentAt: 'desc' },
    });
    res.json(lendings);
  } catch (err) {
    next(err);
  }
});

export default router;
