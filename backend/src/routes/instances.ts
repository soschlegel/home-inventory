import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';
import { uploadDocument } from '../utils/upload';

const router = Router();
router.use(authenticate);

const InstanceBody = z.object({
  quantity: z.coerce.number().positive().default(1),
  purchaseUrl: z.string().url().optional().or(z.literal('')),
  condition: z.enum(['NEW', 'GOOD', 'WORN', 'BROKEN']).optional(),
  serialNumber: z.string().optional(),
  purchasePrice: z.coerce.number().nonnegative().optional(),
  purchaseDate: z.coerce.date().optional(),
  warrantyUntil: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  locationId: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
});

function deleteFile(url: string) {
  const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
  const filename = path.basename(url);
  try { fs.unlinkSync(path.join(uploadDir, filename)); } catch { /* ignore */ }
}

const productSelect = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  barcode: true,
  unit: true,
  productUrl: true,
  minQuantity: true,
  expiryWarningDays: true,
  productGroupId: true,
  productGroup: { select: { id: true, name: true, minQuantity: true } },
  tags: { include: { tag: true } },
} as const;

const InstanceCreateBody = z.object({
  productId: z.string().min(1),
  locationId: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
  quantity: z.coerce.number().positive().default(1),
  purchaseUrl: z.string().url().optional().or(z.literal('')),
});

// POST /api/instances
router.post('/', requireEditor, async (req, res, next) => {
  try {
    const data = InstanceCreateBody.parse(req.body);
    const product = await prisma.product.findFirst({ where: { id: data.productId } });
    if (!product) { res.status(404).json({ error: 'Produkt nicht gefunden' }); return; }
    const instance = await prisma.instance.create({
      data,
      include: { product: { select: productSelect } },
    });
    res.status(201).json(instance);
  } catch (err) { next(err); }
});

// GET /api/instances
router.get('/', async (_req, res, next) => {
  try {
    const instances = await prisma.instance.findMany({
      include: {
        product: { select: productSelect },
        location: {
          include: {
            room: { select: { id: true, key: true, name: true } },
            parent: { select: { id: true, name: true } },
          },
        },
        _count: { select: { lendings: { where: { returnedAt: null } } } },
      },
      orderBy: { product: { name: 'asc' } },
    });
    res.json(instances);
  } catch (err) { next(err); }
});

// GET /api/instances/search?q=...
router.get('/search', async (req, res, next) => {
  try {
    const q = z.string().min(1).parse(req.query.q);
    const instances = await prisma.instance.findMany({
      where: {
        OR: [
          { product: { name: { contains: q, mode: 'insensitive' } } },
          { product: { description: { contains: q, mode: 'insensitive' } } },
          { product: { barcode: { equals: q } } },
          { serialNumber: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        product: { select: productSelect },
        location: {
          include: {
            room: { select: { id: true, key: true, name: true } },
            parent: { select: { id: true, name: true } },
          },
        },
        _count: { select: { lendings: { where: { returnedAt: null } } } },
      },
      orderBy: { product: { name: 'asc' } },
      take: 50,
    });
    res.json(instances);
  } catch (err) { next(err); }
});

// GET /api/instances/low-stock
router.get('/low-stock', async (_req, res, next) => {
  try {
    const instances = await prisma.instance.findMany({
      where: {
        OR: [
          { product: { minQuantity: { not: null } } },
          { product: { productGroup: { minQuantity: { not: null } } } },
        ],
      },
      select: {
        productId: true,
        quantity: true,
        product: {
          select: {
            id: true, name: true, imageUrl: true, minQuantity: true,
            productGroupId: true,
            productGroup: { select: { id: true, name: true, minQuantity: true } },
          },
        },
      },
    });

    type LowStockEntry = {
      type: 'product' | 'group';
      id: string;
      name: string;
      imageUrl: string | null;
      minQuantity: number;
      totalQuantity: number;
    };
    const byKey = new Map<string, LowStockEntry>();

    for (const inst of instances) {
      const p = inst.product;
      if (p.productGroup && p.productGroup.minQuantity != null) {
        const key = 'group_' + p.productGroup.id;
        const entry = byKey.get(key);
        if (entry) { entry.totalQuantity += inst.quantity; }
        else { byKey.set(key, { type: 'group', id: p.productGroup.id, name: p.productGroup.name, imageUrl: null, minQuantity: p.productGroup.minQuantity, totalQuantity: inst.quantity }); }
      } else if (p.minQuantity != null) {
        const key = 'product_' + p.id;
        const entry = byKey.get(key);
        if (entry) { entry.totalQuantity += inst.quantity; }
        else { byKey.set(key, { type: 'product', id: p.id, name: p.name, imageUrl: p.imageUrl, minQuantity: p.minQuantity, totalQuantity: inst.quantity }); }
      }
    }

    res.json([...byKey.values()].filter((e) => e.totalQuantity < e.minQuantity));
  } catch (err) { next(err); }
});

// GET /api/instances/expiring-soon
router.get('/expiring-soon', async (_req, res, next) => {
  try {
    const now = new Date();
    const instances = await prisma.instance.findMany({
      where: { expiryDate: { not: null } },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, expiryWarningDays: true } },
        location: { include: { room: { select: { id: true, name: true } } } },
      },
    });
    const expiringSoon = instances.filter((inst) => {
      if (!inst.expiryDate) return false;
      const days = inst.product.expiryWarningDays ?? 30;
      const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      return inst.expiryDate <= threshold;
    });
    res.json(expiringSoon);
  } catch (err) { next(err); }
});

// GET /api/instances/:id
router.get('/:id', async (req, res, next) => {
  try {
    const instance = await prisma.instance.findFirst({
      where: { id: req.params.id },
      include: {
        product: {
          include: {
            tags: { include: { tag: true } },
            documents: { orderBy: { createdAt: 'desc' } },
          },
        },
        documents: { orderBy: { createdAt: 'desc' } },
        lendings: { orderBy: { lentAt: 'desc' } },
        location: {
          include: {
            room: { select: { id: true, key: true, name: true } },
            parent: { select: { id: true, name: true } },
          },
        },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });
    if (!instance) { res.status(404).json({ error: 'Exemplar nicht gefunden' }); return; }
    res.json(instance);
  } catch (err) { next(err); }
});

// PUT /api/instances/:id
router.put('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.instance.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Exemplar nicht gefunden' }); return; }
    const data = InstanceBody.partial().parse(req.body);
    const instance = await prisma.instance.update({
      where: { id: req.params.id },
      data,
      include: {
        product: { select: productSelect },
      },
    });
    res.json(instance);
  } catch (err) { next(err); }
});

// DELETE /api/instances/:id
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.instance.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Exemplar nicht gefunden' }); return; }
    await prisma.instance.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// POST /api/instances/:id/documents
router.post('/:id/documents', requireEditor, uploadDocument.single('document'), async (req, res, next) => {
  try {
    const existing = await prisma.instance.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Exemplar nicht gefunden' }); return; }
    if (!req.file) { res.status(400).json({ error: 'Kein Dokument hochgeladen' }); return; }
    const doc = await prisma.instanceDocument.create({
      data: {
        instanceId: req.params.id,
        originalName: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });
    res.status(201).json(doc);
  } catch (err) { next(err); }
});

// DELETE /api/instances/:id/documents/:docId
router.delete('/:id/documents/:docId', requireEditor, async (req, res, next) => {
  try {
    const doc = await prisma.instanceDocument.findFirst({
      where: { id: req.params.docId, instanceId: req.params.id },
    });
    if (!doc) { res.status(404).json({ error: 'Dokument nicht gefunden' }); return; }
    deleteFile(doc.url);
    await prisma.instanceDocument.delete({ where: { id: req.params.docId } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
