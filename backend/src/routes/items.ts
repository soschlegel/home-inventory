import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';
import { upload } from '../utils/upload';

const router = Router();
router.use(authenticate);

const ItemBody = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  quantity: z.coerce.number().positive().default(1),
  unit: z.string().optional(),
  minQuantity: z.coerce.number().positive().optional(),
  condition: z.enum(['NEW', 'GOOD', 'WORN', 'BROKEN']).optional(),
  purchaseUrl: z.string().url().optional().or(z.literal('')),
  purchasePrice: z.coerce.number().nonnegative().optional(),
  purchaseDate: z.coerce.date().optional(),
  warrantyUntil: z.coerce.date().optional(),
  serialNumber: z.string().optional(),
  barcode: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

async function findTagsByKeys(keys: string[]) {
  return prisma.tag.findMany({ where: { key: { in: keys } } });
}

function deleteImageFile(imageUrl: string) {
  const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
  const filename = path.basename(imageUrl);
  try { fs.unlinkSync(path.join(uploadDir, filename)); } catch { /* ignore */ }
}

// GET /api/items
router.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.item.findMany({
      include: {
        location: {
          include: {
            room: { select: { id: true, key: true, name: true } },
            parent: { select: { id: true, name: true } },
          },
        },
        tags: { include: { tag: true } },
        _count: {
          select: { lendings: { where: { returnedAt: null } } },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/search?q=...
router.get('/search', async (req, res, next) => {
  try {
    const q = z.string().min(1).parse(req.query.q);
    const items = await prisma.item.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { serialNumber: { contains: q, mode: 'insensitive' } },
          { barcode: { equals: q } },
        ],
      },
      include: {
        location: {
          include: {
            room: { select: { id: true, key: true, name: true } },
            parent: { select: { id: true, name: true } },
          },
        },
        tags: { include: { tag: true } },
        _count: {
          select: { lendings: { where: { returnedAt: null } } },
        },
      },
      orderBy: { name: 'asc' },
      take: 50,
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/low-stock
router.get('/low-stock', async (_req, res, next) => {
  try {
    const items = await prisma.item.findMany({
      where: { minQuantity: { not: null } },
      include: {
        location: { include: { room: { select: { id: true, name: true } } } },
      },
    });
    res.json(items.filter((i) => i.minQuantity !== null && i.quantity < i.minQuantity));
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await prisma.item.findFirst({
      where: { id: req.params.id },
      include: {
        tags: { include: { tag: true } },
        lendings: { orderBy: { lentAt: 'desc' } },
        location: {
          include: {
            room: { select: { id: true, key: true, name: true } },
            parent: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!item) { res.status(404).json({ error: 'Gegenstand nicht gefunden' }); return; }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// PUT /api/items/:id
router.put('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.item.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Gegenstand nicht gefunden' }); return; }
    const { tags: tagKeys, ...data } = ItemBody.partial().parse(req.body);
    const tags = tagKeys !== undefined ? await findTagsByKeys(tagKeys) : undefined;
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: {
        ...data,
        purchaseUrl: data.purchaseUrl === '' ? null : data.purchaseUrl,
        ...(tags !== undefined ? {
          tags: {
            deleteMany: {},
            create: tags.map((t) => ({ tagId: t.id })),
          },
        } : {}),
      },
      include: { tags: { include: { tag: true } } },
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/items/:id
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.item.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Gegenstand nicht gefunden' }); return; }
    if (existing.imageUrl) deleteImageFile(existing.imageUrl);
    await prisma.item.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/items/:id/image
router.post('/:id/image', requireEditor, upload.single('image'), async (req, res, next) => {
  try {
    const existing = await prisma.item.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Gegenstand nicht gefunden' }); return; }
    if (!req.file) { res.status(400).json({ error: 'Kein Bild hochgeladen' }); return; }
    if (existing.imageUrl) deleteImageFile(existing.imageUrl);
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: { imageUrl: `/uploads/${req.file.filename}` },
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

export default router;
