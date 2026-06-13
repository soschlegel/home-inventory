import { Router } from 'express';

const router = Router();

// Replaced by /api/products and /api/instances
router.all('*', (_req, res) => {
  res.status(410).json({ error: 'Items API removed. Use /api/products and /api/instances.' });
});

export default router;
