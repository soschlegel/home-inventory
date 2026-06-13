import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signAccess, signRefresh, verifyRefresh } from '../utils/jwt';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  name: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'registration_enabled' } });
    if (setting?.value === 'false') {
      res.status(403).json({ error: 'Registrierung ist deaktiviert' });
      return;
    }
    const { email, password, name } = RegisterSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'E-Mail bereits registriert' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, role: true },
    });
    res.status(201).json({
      user,
      accessToken: signAccess(user.id, user.role),
      refreshToken: signRefresh(user.id),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'E-Mail oder Passwort falsch' });
      return;
    }
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken: signAccess(user.id, user.role),
      refreshToken: signRefresh(user.id),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh — liest aktuelle Rolle aus DB, damit Rollenänderungen wirksam werden
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const payload = verifyRefresh(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true },
    });
    if (!user) {
      res.status(401).json({ error: 'Nutzer nicht gefunden' });
      return;
    }
    res.json({ accessToken: signAccess(user.id, user.role) });
  } catch (err) {
    next(err);
  }
});

export default router;
