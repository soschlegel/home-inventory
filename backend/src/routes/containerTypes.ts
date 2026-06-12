import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const ContainerTypeBody = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// GET /api/container-types
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const types = await prisma.containerType.findMany({
      where: { userId },
      include: { _count: { select: { locations: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(types);
  } catch (err) {
    next(err);
  }
});

// POST /api/container-types
router.post('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const data = ContainerTypeBody.parse(req.body);
    const type = await prisma.containerType.create({ data: { ...data, userId } });
    res.status(201).json(type);
  } catch (err) {
    next(err);
  }
});

// PUT /api/container-types/:id
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const existing = await prisma.containerType.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Container-Typ nicht gefunden' }); return; }
    const data = ContainerTypeBody.partial().parse(req.body);
    const type = await prisma.containerType.update({ where: { id: req.params.id }, data });
    res.json(type);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/container-types/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const existing = await prisma.containerType.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Container-Typ nicht gefunden' }); return; }
    // onDelete: SetNull im Schema — Locations behalten ihre Form, verlieren nur den Typ
    await prisma.containerType.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
