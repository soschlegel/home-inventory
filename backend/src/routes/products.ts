import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';
import { upload, uploadDocument } from '../utils/upload';

const router = Router();
router.use(authenticate);

const ProductBody = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  barcode: z.string().optional(),
  purchaseUrl: z.string().url().optional().or(z.literal('')),
  minQuantity: z.coerce.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
});

async function findTagsByKeys(keys: string[]) {
  return prisma.tag.findMany({ where: { key: { in: keys } } });
}

function deleteFile(url: string) {
  const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
  const filename = path.basename(url);
  try { fs.unlinkSync(path.join(uploadDir, filename)); } catch { /* ignore */ }
}

// GET /api/products
router.get('/', async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        tags: { include: { tag: true } },
        _count: { select: { instances: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (err) { next(err); }
});

// GET /api/products/search?q=...
router.get('/search', async (req, res, next) => {
  try {
    const q = z.string().min(1).parse(req.query.q);
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { barcode: { equals: q } },
        ],
      },
      include: {
        tags: { include: { tag: true } },
        _count: { select: { instances: true } },
      },
      orderBy: { name: 'asc' },
      take: 20,
    });
    res.json(products);
  } catch (err) { next(err); }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id },
      include: {
        tags: { include: { tag: true } },
        documents: { orderBy: { createdAt: 'desc' } },
        instances: {
          include: {
            location: {
              include: { room: { select: { id: true, key: true, name: true } } },
            },
            lendings: { where: { returnedAt: null }, take: 1 },
            assignedUser: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!product) { res.status(404).json({ error: 'Produkt nicht gefunden' }); return; }
    res.json(product);
  } catch (err) { next(err); }
});

// POST /api/products
router.post('/', requireEditor, async (req, res, next) => {
  try {
    const { tags: tagKeys, ...data } = ProductBody.parse(req.body);
    const tags = tagKeys?.length ? await findTagsByKeys(tagKeys) : [];
    const product = await prisma.product.create({
      data: {
        ...data,
        tags: { create: tags.map((t) => ({ tagId: t.id })) },
      },
      include: { tags: { include: { tag: true } } },
    });
    res.status(201).json(product);
  } catch (err) { next(err); }
});

// PUT /api/products/:id
router.put('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Produkt nicht gefunden' }); return; }
    const { tags: tagKeys, ...data } = ProductBody.partial().parse(req.body);
    const tags = tagKeys !== undefined ? await findTagsByKeys(tagKeys) : undefined;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...data,
        purchaseUrl: data.purchaseUrl === '' ? null : data.purchaseUrl,
        ...(tags !== undefined ? {
          tags: { deleteMany: {}, create: tags.map((t) => ({ tagId: t.id })) },
        } : {}),
      },
      include: { tags: { include: { tag: true } } },
    });
    res.json(product);
  } catch (err) { next(err); }
});

// DELETE /api/products/:id
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Produkt nicht gefunden' }); return; }
    if (existing.imageUrl) deleteFile(existing.imageUrl);
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// POST /api/products/:id/image
router.post('/:id/image', requireEditor, upload.single('image'), async (req, res, next) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Produkt nicht gefunden' }); return; }
    if (!req.file) { res.status(400).json({ error: 'Kein Bild hochgeladen' }); return; }
    if (existing.imageUrl) deleteFile(existing.imageUrl);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { imageUrl: `/uploads/${req.file.filename}` },
    });
    res.json(product);
  } catch (err) { next(err); }
});

// POST /api/products/:id/documents
router.post('/:id/documents', requireEditor, uploadDocument.single('document'), async (req, res, next) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Produkt nicht gefunden' }); return; }
    if (!req.file) { res.status(400).json({ error: 'Kein Dokument hochgeladen' }); return; }
    const doc = await prisma.productDocument.create({
      data: {
        productId: req.params.id,
        originalName: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });
    res.status(201).json(doc);
  } catch (err) { next(err); }
});

// DELETE /api/products/:id/documents/:docId
router.delete('/:id/documents/:docId', requireEditor, async (req, res, next) => {
  try {
    const doc = await prisma.productDocument.findFirst({
      where: { id: req.params.docId, productId: req.params.id },
    });
    if (!doc) { res.status(404).json({ error: 'Dokument nicht gefunden' }); return; }
    deleteFile(doc.url);
    await prisma.productDocument.delete({ where: { id: req.params.docId } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
