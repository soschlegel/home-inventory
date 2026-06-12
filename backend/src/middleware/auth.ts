import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
      userRole: string;
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
    req.userRole = payload.role ?? 'EDITOR';
    next();
  } catch {
    res.status(401).json({ error: 'Token ungültig oder abgelaufen' });
  }
}

export function requireEditor(req: Request, res: Response, next: NextFunction): void {
  if (req.userRole !== 'EDITOR') {
    res.status(403).json({ error: 'Keine Berechtigung – nur Editoren dürfen Änderungen vornehmen' });
    return;
  }
  next();
}
