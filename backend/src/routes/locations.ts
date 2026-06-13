import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const LocationBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  containerTypeId: z.string().optional(),
  parentId: z.string().optional(),
});

const InstanceCreateBody = z.object({
  productId: z.string().optional(),
  name: z.string().min(1).max(200).optional(),
  quantity: z.coerce.number().positive().default(1),
  unit: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

async function findTagsByKeys(keys: string[]) {
  return prisma.tag.findMany({ where: { key: { in: keys } } });
}

// GET /api/locations/:locationId/instances
router.get('/:locationId/instances', async (req, res, next) => {
  try {
    const location = await prisma.location.findFirst({ where: { id: req.params.locationId } });
    if (!location) { res.status(404).json({ error: 'Ort nicht gefunden' }); return; }
    const instances = await prisma.instance.findMany({
      where: { locationId: req.params.locationId },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, tags: { include: { tag: true } } } },
        lendings: { where: { returnedAt: null }, take: 1 },
      },
      orderBy: { product: { name: 'asc' } },
    });
    res.json(instances);
  } catch (err) {
    next(err);
  }
});

// POST /api/locations/:locationId/instances
router.post('/:locationId/instances', requireEditor, async (req, res, next) => {
  try {
    const location = await prisma.location.findFirst({ where: { id: req.params.locationId } });
    if (!location) { res.status(404).json({ error: 'Ort nicht gefunden' }); return; }

    const { productId, name, tags: tagKeys, ...instData } = InstanceCreateBody.parse(req.body);

    if (!productId && !name) {
      res.status(400).json({ error: 'productId oder name ist erforderlich' });
      return;
    }

    let pid = productId;
    if (!pid) {
      const tags = tagKeys?.length ? await findTagsByKeys(tagKeys) : [];
      const product = await prisma.product.create({
        data: {
          name: name!,
          tags: { create: tags.map((t) => ({ tagId: t.id })) },
        },
      });
      pid = product.id;
    }

    const instance = await prisma.instance.create({
      data: {
        ...instData,
        productId: pid,
        locationId: req.params.locationId,
      },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, tags: { include: { tag: true } } } },
        lendings: { where: { returnedAt: null }, take: 1 },
      },
    });
    res.status(201).json(instance);
  } catch (err) {
    next(err);
  }
});

// GET /api/locations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const location = await prisma.location.findFirst({
      where: { id: req.params.id },
      include: {
        room: { select: { id: true, key: true, name: true } },
        parent: { select: { id: true, name: true } },
        containerType: true,
        children: {
          include: {
            containerType: true,
            _count: { select: { instances: true } },
          },
        },
        instances: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
            lendings: { where: { returnedAt: null }, take: 1 },
          },
          orderBy: { product: { name: 'asc' } },
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
router.put('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.location.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Ort nicht gefunden' }); return; }
    const data = LocationBody.partial().parse(req.body);
    const location = await prisma.location.update({ where: { id: req.params.id }, data });
    res.json(location);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/locations/:id
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.location.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Ort nicht gefunden' }); return; }
    await prisma.location.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
