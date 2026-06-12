import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/tags — alle verwendeten Tags
router.get('/', async (_req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { items: { some: {} } },
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(tags);
  } catch (err) {
    next(err);
  }
});

export default router;
