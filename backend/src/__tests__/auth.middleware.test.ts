import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as jwtUtils from '../utils/jwt';

vi.mock('../utils/jwt');

function mockReqRes(authHeader?: string) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('authenticate middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('antwortet 401 wenn kein Authorization-Header', () => {
    const { req, res, next } = mockReqRes();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('antwortet 401 wenn Schema nicht "Bearer" ist', () => {
    const { req, res, next } = mockReqRes('Basic dXNlcjpwYXNz');
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('antwortet 401 bei ungültigem Token', () => {
    const { req, res, next } = mockReqRes('Bearer invalidtoken');
    vi.mocked(jwtUtils.verifyAccess).mockImplementation(() => {
      throw new Error('jwt malformed');
    });
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('setzt req.userId und ruft next() bei gültigem Token', () => {
    const { req, res, next } = mockReqRes('Bearer validtoken');
    vi.mocked(jwtUtils.verifyAccess).mockReturnValue({ sub: 'user-42' });
    authenticate(req, res, next);
    expect((req as any).userId).toBe('user-42');
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
