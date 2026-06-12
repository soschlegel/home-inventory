import { describe, it, expect } from 'vitest';
import spec from '../openapi';

describe('OpenAPI Spec', () => {
  it('ist eine gültige OpenAPI 3.0 Spezifikation', () => {
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toBeTruthy();
    expect(spec.info.version).toBeTruthy();
  });

  it('hat einen BearerAuth Security-Scheme', () => {
    const scheme = spec.components.securitySchemes.BearerAuth as any;
    expect(scheme.type).toBe('http');
    expect(scheme.scheme).toBe('bearer');
    expect(scheme.bearerFormat).toBe('JWT');
  });

  it('enthält alle Auth-Endpunkte', () => {
    expect(spec.paths['/auth/login']).toBeDefined();
    expect(spec.paths['/auth/register']).toBeDefined();
    expect(spec.paths['/auth/refresh']).toBeDefined();
  });

  it('auth-Endpunkte erfordern keine Authentifizierung', () => {
    const login = spec.paths['/auth/login'].post as any;
    const register = spec.paths['/auth/register'].post as any;
    expect(login.security).toEqual([]);
    expect(register.security).toEqual([]);
  });

  it('enthält alle Raum-Endpunkte', () => {
    expect(spec.paths['/rooms']).toBeDefined();
    expect(spec.paths['/rooms/{id}']).toBeDefined();
    expect(spec.paths['/rooms/{roomId}/locations']).toBeDefined();
  });

  it('enthält alle Item-Endpunkte', () => {
    expect(spec.paths['/items/{id}']).toBeDefined();
    expect(spec.paths['/items/search']).toBeDefined();
    expect(spec.paths['/items/low-stock']).toBeDefined();
    expect(spec.paths['/items/{id}/image']).toBeDefined();
  });

  it('enthält alle Ausleihe-Endpunkte', () => {
    expect(spec.paths['/lendings/active']).toBeDefined();
    expect(spec.paths['/lendings/{id}']).toBeDefined();
    expect(spec.paths['/lendings/{id}/return']).toBeDefined();
    expect(spec.paths['/items/{itemId}/lend']).toBeDefined();
    expect(spec.paths['/items/{itemId}/lendings']).toBeDefined();
  });

  it('enthält User-Management-Endpunkte', () => {
    expect(spec.paths['/users']).toBeDefined();
    expect(spec.paths['/users/{id}/role']).toBeDefined();
    expect(spec.paths['/users/{id}']).toBeDefined();
  });

  it('hat alle erwarteten Schemas', () => {
    const schemas = Object.keys(spec.components.schemas);
    expect(schemas).toContain('User');
    expect(schemas).toContain('UserRole');
    expect(schemas).toContain('Item');
    expect(schemas).toContain('ItemCondition');
    expect(schemas).toContain('Room');
    expect(schemas).toContain('Location');
    expect(schemas).toContain('Lending');
    expect(schemas).toContain('Tag');
    expect(schemas).toContain('ContainerType');
    expect(schemas).toContain('AuthResponse');
    expect(schemas).toContain('Error');
  });

  it('UserRole-Schema enthält EDITOR und VIEWER', () => {
    const userRole = spec.components.schemas.UserRole as any;
    expect(userRole.enum).toContain('EDITOR');
    expect(userRole.enum).toContain('VIEWER');
  });

  it('ItemCondition-Schema enthält alle vier Zustände', () => {
    const condition = spec.components.schemas.ItemCondition as any;
    expect(condition.enum).toEqual(expect.arrayContaining(['NEW', 'GOOD', 'WORN', 'BROKEN']));
  });
});
