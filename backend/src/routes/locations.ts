import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const LocationBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  containerTypeId: z.string().optional(),
  parentId: z.string().optional(),
});

const ItemBody = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  quantity: z.coerce.number().positive().default(1),
  unit: z.string().optional(),
  minQuantity: z.coerce.number().positive().optional(),
  condition: z.enum(['NEW', 'GOOD', 'WORN', 'BROKEN']).optional(),
  purchaseUrl: z.string().url().optional(),
  purchasePrice: z.coerce.number().nonnegative().optional(),
  purchaseDate: z.coerce.date().optional(),
  warrantyUntil: z.coerce.date().optional(),
  serialNumber: z.string().optional(),
  barcode: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

async function upsertTags(tagNames: string[]) {
  return Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({ where: { name }, create: { name }, update: {} }),
    ),
  );
}

// GET /api/locations/:locationId/items
router.get('/:locationId/items', async (req, res, next) => {
  try {
    const userId = req.userId;
    const location = await prisma.location.findFirst({
      where: { id: req.params.locationId, room: { userId } },
    });
    if (!location) { res.status(404).json({ error: 'Ort nicht gefunden' }); return; }
    const items = await prisma.item.findMany({
      where: { locationId: req.params.locationId },
      include: { tags: { include: { tag: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// POST /api/locations/:locationId/items
router.post('/:locationId/items', async (req, res, next) => {
  try {
    const userId = req.userId;
    const location = await prisma.location.findFirst({
      where: { id: req.params.locationId, room: { userId } },
    });
    if (!location) { res.status(404).json({ error: 'Ort nicht gefunden' }); return; }
    const { tags: tagNames, ...data } = ItemBody.parse(req.body);
    const tags = tagNames?.length ? await upsertTags(tagNames) : [];
    const item = await prisma.item.create({
      data: {
        ...data,
        locationId: req.params.locationId,
        tags: { create: tags.map((t) => ({ tagId: t.id })) },
      },
      include: { tags: { include: { tag: true } } },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// GET /api/locations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const location = await prisma.location.findFirst({
      where: { id: req.params.id, room: { userId } },
      include: {
        room: { select: { id: true, name: true } },
        parent: { select: { id: true, name: true } },
        children: { include: { _count: { select: { items: true } } } },
        items: {
          include: { tags: { include: { tag: true } } },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!location) { res.status(404).json({ error: 'Ort nicht gefunden' }); return; }
    res.json(location);
  } catch (err) {
    next(err);
  }
});

// PUT /api/locations/:id
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const existing = await prisma.location.findFirst({
      where: { id: req.params.id, room: { userId } },
    });
    if (!existing) { res.status(404).json({ error: 'Ort nicht gefunden' }); return; }
    const data = LocationBody.partial().parse(req.body);
    const location = await prisma.location.update({ where: { id: req.params.id }, data });
    res.json(location);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/locations/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const existing = await prisma.location.findFirst({
      where: { id: req.params.id, room: { userId } },
    });
    if (!existing) { res.status(404).json({ error: 'Ort nicht gefunden' }); return; }
    await prisma.location.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
