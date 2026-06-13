import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireEditor } from '../middleware/auth';

const router = Router();

// GET /api/settings — öffentlich (für Login-Seite: Registrierung erlaubt?)
router.get('/', async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    // Standardwert: Registrierung ist erlaubt, solange nicht explizit deaktiviert
    res.json({
      registration_enabled: map['registration_enabled'] !== 'false',
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings — nur EDITOR
router.put('/', authenticate, requireEditor, async (req, res, next) => {
  try {
    const { registration_enabled } = z
      .object({ registration_enabled: z.boolean() })
      .parse(req.body);

    await prisma.setting.upsert({
      where: { key: 'registration_enabled' },
      create: { key: 'registration_enabled', value: String(registration_enabled) },
      update: { value: String(registration_enabled) },
    });

    res.json({ registration_enabled });
  } catch (err) {
    next(err);
  }
});

export default router;
