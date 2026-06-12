import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorHandler } from '../middleware/errorHandler';

function mockRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  (res.json as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
}

const req = {} as Request;
const next = vi.fn() as unknown as NextFunction;

describe('errorHandler', () => {
  it('behandelt ZodError mit Status 400 und Fehlerdetails', () => {
    const res = mockRes();
    const err = new ZodError([{ code: 'custom', message: 'Pflichtfeld', path: ['email'] }]);
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validierungsfehler', details: expect.any(Array) }),
    );
  });

  it('behandelt generische Error mit Status 500', () => {
    const res = mockRes();
    errorHandler(new Error('Datenbankfehler'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Interner Serverfehler' });
  });

  it('behandelt unbekannte Wurfwerte (string) mit Status 500', () => {
    const res = mockRes();
    errorHandler('etwas lief schief', req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
