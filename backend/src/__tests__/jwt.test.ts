import { describe, it, expect } from 'vitest';
import { signAccess, signRefresh, verifyAccess, verifyRefresh } from '../utils/jwt';

// env vars sind in vitest.config.ts gesetzt — module-load-time constants werden korrekt befüllt

describe('signAccess / verifyAccess', () => {
  const userId = 'user-abc-123';

  it('gibt einen JWT-String zurück', () => {
    const token = signAccess(userId);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('round-trip: userId bleibt erhalten', () => {
    const token = signAccess(userId);
    expect(verifyAccess(token).sub).toBe(userId);
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
    const access = signAccess(userId);
    const refresh = signRefresh(userId);
    expect(access).not.toBe(refresh);
  });
});
