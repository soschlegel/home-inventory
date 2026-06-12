import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/tags — nur Tags, die dem eingeloggten User gehören
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as AuthRequest).userId;
    const tags = await prisma.tag.findMany({
      where: {
        items: { some: { item: { location: { room: { userId } } } } },
      },
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(tags);
  } catch (err) {
    next(err);
  }
});

export default router;
