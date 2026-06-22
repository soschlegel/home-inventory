import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireEditor);

// GET /api/admin/export
router.get('/export', async (_req, res, next) => {
  try {
    const [units, tags, containerTypes, rooms, locations, productGroups, products, productTags, instances, lendings] =
      await Promise.all([
        prisma.unit.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.tag.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.containerType.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.room.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.location.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.productGroup.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.product.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.productTag.findMany(),
        prisma.instance.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.lending.findMany({ orderBy: { lentAt: 'asc' } }),
      ]);

    const filename = `home-inventory-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json({
      version: '3.0',
      exportedAt: new Date().toISOString(),
      data: { units, tags, containerTypes, rooms, locations, productGroups, products, productTags, instances, lendings },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/import
const importSchema = z.object({
  version: z.string(),
  data: z.object({
    units: z.array(
      z.object({ id: z.string(), key: z.string(), name: z.string(), createdAt: z.string() }),
    ),
    tags: z.array(
      z.object({ id: z.string(), key: z.string(), name: z.string(), createdAt: z.string() }),
    ),
    containerTypes: z.array(
      z.object({
        id: z.string(),
        key: z.string().nullable().optional(),
        name: z.string(),
        icon: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
        createdAt: z.string(),
      }),
    ),
    rooms: z.array(
      z.object({
        id: z.string(),
        key: z.string().nullable().optional(),
        name: z.string(),
        description: z.string().nullable().optional(),
        icon: z.string().nullable().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
    ),
    locations: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable().optional(),
        containerTypeId: z.string().nullable().optional(),
        roomId: z.string(),
        parentId: z.string().nullable().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
    ),
    productGroups: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        minQuantity: z.number().nullable().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
    ).optional(),
    products: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        barcode: z.string().nullable().optional(),
        productUrl: z.string().nullable().optional(),
        unit: z.string().nullable().optional(),
        minQuantity: z.number().nullable().optional(),
        expiryWarningDays: z.number().nullable().optional(),
        productGroupId: z.string().nullable().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
    ),
    productTags: z.array(z.object({ productId: z.string(), tagId: z.string() })),
    instances: z.array(
      z.object({
        id: z.string(),
        productId: z.string(),
        quantity: z.number().optional(),
        purchaseUrl: z.string().nullable().optional(),
        condition: z.enum(['NEW', 'GOOD', 'WORN', 'BROKEN']).nullable().optional(),
        serialNumber: z.string().nullable().optional(),
        purchasePrice: z.number().nullable().optional(),
        purchaseDate: z.string().nullable().optional(),
        warrantyUntil: z.string().nullable().optional(),
        expiryDate: z.string().nullable().optional(),
        locationId: z.string().nullable().optional(),
        assignedUserId: z.string().nullable().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
    ),
    lendings: z.array(
      z.object({
        id: z.string(),
        instanceId: z.string(),
        lentTo: z.string(),
        lentAt: z.string(),
        returnedAt: z.string().nullable().optional(),
        note: z.string().nullable().optional(),
        createdAt: z.string(),
      }),
    ),
  }),
});

type LocationRow = z.infer<typeof importSchema>['data']['locations'][number];

function sortLocationsTopologically(locations: LocationRow[]): LocationRow[] {
  const byId = new Map(locations.map((l) => [l.id, l]));
  const sorted: LocationRow[] = [];
  const visited = new Set<string>();

  function visit(id: string) {
    if (visited.has(id)) return;
    const loc = byId.get(id);
    if (!loc) return;
    if (loc.parentId) visit(loc.parentId);
    visited.add(id);
    sorted.push(loc);
  }

  for (const loc of locations) visit(loc.id);
  return sorted;
}

router.post('/import', async (req, res, next) => {
  try {
    const { data } = importSchema.parse(req.body);
    const sortedLocations = sortLocationsTopologically(data.locations);

    await prisma.$transaction(async (tx) => {
      await tx.lending.deleteMany();
      await tx.instanceDocument.deleteMany();
      await tx.instance.deleteMany();
      await tx.productDocument.deleteMany();
      await tx.productTag.deleteMany();
      await tx.product.deleteMany();
      await tx.productGroup.deleteMany();
      await tx.location.updateMany({ data: { parentId: null } });
      await tx.location.deleteMany();
      await tx.room.deleteMany();
      await tx.containerType.deleteMany();
      await tx.tag.deleteMany();
      await tx.unit.deleteMany();

      if (data.units.length) {
        await tx.unit.createMany({
          data: data.units.map((u) => ({ ...u, createdAt: new Date(u.createdAt) })),
        });
      }
      if (data.tags.length) {
        await tx.tag.createMany({
          data: data.tags.map((t) => ({ ...t, createdAt: new Date(t.createdAt) })),
        });
      }
      if (data.containerTypes.length) {
        await tx.containerType.createMany({
          data: data.containerTypes.map((ct) => ({ ...ct, createdAt: new Date(ct.createdAt) })),
        });
      }
      if (data.rooms.length) {
        await tx.room.createMany({
          data: data.rooms.map((r) => ({
            ...r,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
          })),
        });
      }
      for (const loc of sortedLocations) {
        await tx.location.create({
          data: {
            id: loc.id,
            name: loc.name,
            description: loc.description ?? null,
            containerTypeId: loc.containerTypeId ?? null,
            roomId: loc.roomId,
            parentId: loc.parentId ?? null,
            createdAt: new Date(loc.createdAt),
            updatedAt: new Date(loc.updatedAt),
          },
        });
      }
      if (data.productGroups?.length) {
        await tx.productGroup.createMany({
          data: data.productGroups.map((g) => ({
            id: g.id, name: g.name, minQuantity: g.minQuantity ?? null,
            createdAt: new Date(g.createdAt), updatedAt: new Date(g.updatedAt),
          })),
        });
      }
      if (data.products.length) {
        await tx.product.createMany({
          data: data.products.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description ?? null,
            imageUrl: p.imageUrl ?? null,
            barcode: p.barcode ?? null,
            productUrl: p.productUrl ?? null,
            unit: p.unit ?? null,
            minQuantity: p.minQuantity ?? null,
            expiryWarningDays: p.expiryWarningDays ?? null,
            productGroupId: p.productGroupId ?? null,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          })),
        });
      }
      if (data.productTags.length) {
        await tx.productTag.createMany({ data: data.productTags });
      }
      if (data.instances.length) {
        await tx.instance.createMany({
          data: data.instances.map((i) => ({
            id: i.id,
            productId: i.productId,
            quantity: i.quantity ?? 1,
            purchaseUrl: i.purchaseUrl ?? null,
            condition: i.condition ?? null,
            serialNumber: i.serialNumber ?? null,
            purchasePrice: i.purchasePrice ?? null,
            purchaseDate: i.purchaseDate ? new Date(i.purchaseDate) : null,
            warrantyUntil: i.warrantyUntil ? new Date(i.warrantyUntil) : null,
            expiryDate: i.expiryDate ? new Date(i.expiryDate) : null,
            locationId: i.locationId ?? null,
            assignedUserId: i.assignedUserId ?? null,
            createdAt: new Date(i.createdAt),
            updatedAt: new Date(i.updatedAt),
          })),
        });
      }
      if (data.lendings.length) {
        await tx.lending.createMany({
          data: data.lendings.map((l) => ({
            id: l.id,
            instanceId: l.instanceId,
            lentTo: l.lentTo,
            lentAt: new Date(l.lentAt),
            returnedAt: l.returnedAt ? new Date(l.returnedAt) : null,
            note: l.note ?? null,
            createdAt: new Date(l.createdAt),
          })),
        });
      }
    });

    res.json({ message: 'Import erfolgreich', importedAt: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

export default router;
