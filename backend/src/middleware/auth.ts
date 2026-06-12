import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/jwt';

// userId direkt auf dem Express-Request verfügbar machen – kein Cast nötig
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nicht autorisiert' });
    return;
  }
  try {
    const token = header.slice(7);
    const payload = verifyAccess(token);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Token ungültig oder abgelaufen' });
  }
}
