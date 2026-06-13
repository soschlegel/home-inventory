import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const UnitBody = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/),
  name: z.string().min(1).max(50),
});

// GET /api/units
router.get('/', async (_req, res, next) => {
  try {
    const units = await prisma.unit.findMany({ orderBy: { name: 'asc' } });
    res.json(units);
  } catch (err) {
    next(err);
  }
});

// POST /api/units
router.post('/', requireEditor, async (req, res, next) => {
  try {
    const data = UnitBody.parse(req.body);
    const existing = await prisma.unit.findFirst({
      where: { OR: [{ key: data.key }, { name: data.name }] },
    });
    if (existing) { res.status(409).json({ error: 'Einheit bereits vorhanden' }); return; }
    const unit = await prisma.unit.create({ data });
    res.status(201).json(unit);
  } catch (err) {
    next(err);
  }
});

// PUT /api/units/:id
router.put('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.unit.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Einheit nicht gefunden' }); return; }
    const data = UnitBody.partial().parse(req.body);
    if (data.key && data.key !== existing.key) {
      const keyConflict = await prisma.unit.findFirst({ where: { key: data.key } });
      if (keyConflict) { res.status(409).json({ error: 'Schlüssel bereits vergeben' }); return; }
    }
    if (data.name && data.name !== existing.name) {
      const nameConflict = await prisma.unit.findFirst({ where: { name: data.name } });
      if (nameConflict) { res.status(409).json({ error: 'Name bereits vergeben' }); return; }
    }
    const unit = await prisma.unit.update({ where: { id: req.params.id }, data });
    res.json(unit);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/units/:id
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.unit.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Einheit nicht gefunden' }); return; }
    await prisma.unit.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
