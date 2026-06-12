import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const LendBody = z.object({
  lentTo: z.string().min(1),
  lentAt: z.coerce.date().optional(),
  note: z.string().optional(),
});

// GET /api/lendings/active — alle aktuell ausgeliehenen Gegenstände
router.get('/active', async (req, res, next) => {
  try {
    const userId = req.userId;
    const lendings = await prisma.lending.findMany({
      where: {
        returnedAt: null,
        item: { location: { room: { userId } } },
      },
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
    const userId = req.userId;
    const lending = await prisma.lending.findFirst({
      where: {
        id: req.params.id,
        item: { location: { room: { userId } } },
      },
      include: { item: { select: { id: true, name: true } } },
    });
    if (!lending) { res.status(404).json({ error: 'Ausleihe nicht gefunden' }); return; }
    res.json(lending);
  } catch (err) {
    next(err);
  }
});

// POST /api/items/:itemId/lend — Gegenstand verleihen
router.post('/items/:itemId/lend', async (req, res, next) => {
  try {
    const userId = req.userId;
    const item = await prisma.item.findFirst({
      where: { id: req.params.itemId, location: { room: { userId } } },
    });
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

// PUT /api/lendings/:id/return — Rückgabe eintragen
router.put('/:id/return', async (req, res, next) => {
  try {
    const userId = req.userId;
    const existing = await prisma.lending.findFirst({
      where: {
        id: req.params.id,
        item: { location: { room: { userId } } },
      },
    });
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

// GET /api/items/:itemId/lendings — Verleihistorie eines Gegenstands
router.get('/items/:itemId/lendings', async (req, res, next) => {
  try {
    const userId = req.userId;
    const item = await prisma.item.findFirst({
      where: { id: req.params.itemId, location: { room: { userId } } },
    });
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
