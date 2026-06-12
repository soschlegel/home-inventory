import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export function signAccess(userId: string, role = 'EDITOR') {
  return jwt.sign({ sub: userId, role }, ACCESS_SECRET, { expiresIn: '15m' });
}

export function signRefresh(userId: string) {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccess(token: string): { sub: string; role: string } {
  return jwt.verify(token, ACCESS_SECRET) as { sub: string; role: string };
}

export function verifyRefresh(token: string): { sub: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string };
}
