import { Router } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';

function jsonField(v: Record<string, string> | null | undefined) {
  return v === null ? Prisma.JsonNull : v;
}

const router = Router();
router.use(authenticate);

const translationsSchema = z
  .record(z.string().min(2).max(10), z.string().min(1).max(200))
  .nullable()
  .optional();

const RoomCreateBody = z.object({
  name: z.string().min(1).max(100),
  translations: translationsSchema,
  description: z.string().optional(),
  icon: z.string().optional(),
});

const RoomUpdateBody = z.object({
  name: z.string().min(1).max(100).optional(),
  translations: translationsSchema,
  description: z.string().optional(),
  icon: z.string().optional(),
});

const LocationBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  containerTypeId: z.string().optional(),
  parentId: z.string().optional(),
});

// GET /api/rooms
router.get('/', async (_req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      include: { _count: { select: { locations: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms
router.post('/', requireEditor, async (req, res, next) => {
  try {
    const { translations, ...rest } = RoomCreateBody.parse(req.body);
    const room = await prisma.room.create({
      data: { ...rest, key: randomUUID(), translations: jsonField(translations) },
    });
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
});

// GET /api/rooms/tree – all rooms with full location tree
router.get('/tree', async (_req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        _count: { select: { locations: true } },
        locations: {
          where: { parentId: null },
          include: {
            containerType: true,
            _count: { select: { instances: true } },
            children: {
              include: {
                containerType: true,
                _count: { select: { instances: true } },
                children: {
                  include: {
                    containerType: true,
                    _count: { select: { instances: true } },
                  },
                  orderBy: { name: 'asc' },
                },
              },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
});

// GET /api/rooms/:id
router.get('/:id', async (req, res, next) => {
  try {
    const room = await prisma.room.findFirst({
      where: { id: req.params.id },
      include: {
        locations: {
          where: { parentId: null },
          include: {
            containerType: true,
            children: {
              include: {
                containerType: true,
                _count: { select: { instances: true } },
              },
            },
            _count: { select: { instances: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!room) { res.status(404).json({ error: 'Raum nicht gefunden' }); return; }
    res.json(room);
  } catch (err) {
    next(err);
  }
});

// PUT /api/rooms/:id
router.put('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.room.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Raum nicht gefunden' }); return; }
    const { translations, ...rest } = RoomUpdateBody.parse(req.body);
    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: { ...rest, ...(translations !== undefined ? { translations: jsonField(translations) } : {}) },
    });
    res.json(room);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/rooms/:id
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    const existing = await prisma.room.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Raum nicht gefunden' }); return; }
    await prisma.room.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/rooms/:roomId/locations
router.get('/:roomId/locations', async (req, res, next) => {
  try {
    const room = await prisma.room.findFirst({ where: { id: req.params.roomId } });
    if (!room) { res.status(404).json({ error: 'Raum nicht gefunden' }); return; }
    const locations = await prisma.location.findMany({
      where: { roomId: req.params.roomId, parentId: null },
      include: {
        children: { include: { _count: { select: { instances: true } } } },
        _count: { select: { instances: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(locations);
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/:roomId/locations
router.post('/:roomId/locations', requireEditor, async (req, res, next) => {
  try {
    const room = await prisma.room.findFirst({ where: { id: req.params.roomId } });
    if (!room) { res.status(404).json({ error: 'Raum nicht gefunden' }); return; }
    const data = LocationBody.parse(req.body);
    const location = await prisma.location.create({
      data: { ...data, roomId: req.params.roomId },
    });
    res.status(201).json(location);
  } catch (err) {
    next(err);
  }
});

export default router;
