import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const RoomBody = z.object({
  name: z.string().min(1).max(100),
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
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const rooms = await prisma.room.findMany({
      where: { userId },
      include: { _count: { select: { locations: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms
router.post('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const data = RoomBody.parse(req.body);
    const room = await prisma.room.create({ data: { ...data, userId } });
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
});

// GET /api/rooms/:id
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const room = await prisma.room.findFirst({
      where: { id: req.params.id, userId },
      include: {
        locations: {
          where: { parentId: null },
          include: {
            children: { include: { _count: { select: { items: true } } } },
            _count: { select: { items: true } },
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
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const existing = await prisma.room.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Raum nicht gefunden' }); return; }
    const data = RoomBody.partial().parse(req.body);
    const room = await prisma.room.update({ where: { id: req.params.id }, data });
    res.json(room);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/rooms/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const existing = await prisma.room.findFirst({ where: { id: req.params.id, userId } });
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
    const userId = req.userId;
    const room = await prisma.room.findFirst({ where: { id: req.params.roomId, userId } });
    if (!room) { res.status(404).json({ error: 'Raum nicht gefunden' }); return; }
    const locations = await prisma.location.findMany({
      where: { roomId: req.params.roomId, parentId: null },
      include: {
        children: { include: { _count: { select: { items: true } } } },
        _count: { select: { items: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(locations);
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/:roomId/locations
router.post('/:roomId/locations', async (req, res, next) => {
  try {
    const userId = req.userId;
    const room = await prisma.room.findFirst({ where: { id: req.params.roomId, userId } });
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
