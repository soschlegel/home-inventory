import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/users — alle Nutzer auflisten (nur EDITOR)
router.get('/', requireEditor, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// POST /api/users — neuen Nutzer anlegen (nur EDITOR)
router.post('/', requireEditor, async (req, res, next) => {
  try {
    const { email, password, name, role } = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional(),
      role: z.enum(['EDITOR', 'VIEWER']).default('VIEWER'),
    }).parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'E-Mail bereits vergeben' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/role — Rolle eines Nutzers ändern (nur EDITOR)
router.put('/:id/role', requireEditor, async (req, res, next) => {
  try {
    const { role } = z.object({ role: z.enum(['EDITOR', 'VIEWER']) }).parse(req.body);
    const existing = await prisma.user.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Nutzer nicht gefunden' }); return; }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id — Nutzer löschen (nur EDITOR, nicht sich selbst)
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    if (req.params.id === req.userId) {
      res.status(400).json({ error: 'Eigenen Account kann man nicht löschen' });
      return;
    }
    const existing = await prisma.user.findFirst({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Nutzer nicht gefunden' }); return; }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
