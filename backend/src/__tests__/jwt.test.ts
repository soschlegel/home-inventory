import { describe, it, expect } from 'vitest';
import { signAccess, signRefresh, verifyAccess, verifyRefresh } from '../utils/jwt';

describe('signAccess / verifyAccess', () => {
  const userId = 'user-abc-123';

  it('gibt einen JWT-String zurück', () => {
    const token = signAccess(userId, 'EDITOR');
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('round-trip: userId und Rolle bleiben erhalten', () => {
    const token = signAccess(userId, 'EDITOR');
    const payload = verifyAccess(token);
    expect(payload.sub).toBe(userId);
    expect(payload.role).toBe('EDITOR');
  });

  it('VIEWER-Rolle wird korrekt gespeichert', () => {
    const token = signAccess(userId, 'VIEWER');
    expect(verifyAccess(token).role).toBe('VIEWER');
  });

  it('Standard-Rolle ist EDITOR wenn kein Parameter', () => {
    const token = signAccess(userId);
    expect(verifyAccess(token).role).toBe('EDITOR');
  });

  it('wirft bei ungültigem Token', () => {
    expect(() => verifyAccess('bad.token.here')).toThrow();
  });

  it('wirft bei Token mit falschem Secret (Refresh-Token)', () => {
    const refreshToken = signRefresh(userId);
    expect(() => verifyAccess(refreshToken)).toThrow();
  });
});

describe('signRefresh / verifyRefresh', () => {
  const userId = 'user-xyz-456';

  it('gibt einen JWT-String zurück', () => {
    const token = signRefresh(userId);
    expect(typeof token).toBe('string');
  });

  it('round-trip: userId bleibt erhalten', () => {
    const token = signRefresh(userId);
    expect(verifyRefresh(token).sub).toBe(userId);
  });

  it('wirft bei Access-Token (falsches Secret)', () => {
    const accessToken = signAccess(userId);
    expect(() => verifyRefresh(accessToken)).toThrow();
  });

  it('access- und refresh-tokens sind unterschiedlich', () => {
    expect(signAccess(userId)).not.toBe(signRefresh(userId));
  });
});
