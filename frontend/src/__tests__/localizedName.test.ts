import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockI18n = vi.hoisted(() => ({ language: 'de' }));
vi.mock('i18next', () => ({ default: mockI18n }));

import { locRoomName, locContainerTypeName, locTagName, locUnitName } from '../utils/localizedName';

const mockT = vi.fn((key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key);

beforeEach(() => {
  vi.clearAllMocks();
  mockI18n.language = 'de';
});

describe('locRoomName', () => {
  it('gibt Deutsche Übersetzung zurück wenn lang=de und translations.de vorhanden', () => {
    const room = { name: 'Kitchen', key: 'kitchen', translations: { de: 'Küche', en: 'Kitchen' } };
    expect(locRoomName(mockT as any, room)).toBe('Küche');
  });

  it('gibt Englische Übersetzung zurück wenn lang=en und translations.en vorhanden', () => {
    mockI18n.language = 'en';
    const room = { name: 'Kitchen', key: 'kitchen', translations: { de: 'Küche', en: 'Kitchen' } };
    expect(locRoomName(mockT as any, room)).toBe('Kitchen');
  });

  it('gibt dritte Sprache zurück wenn vorhanden', () => {
    mockI18n.language = 'fr';
    const room = { name: 'Kitchen', key: 'kitchen', translations: { de: 'Küche', en: 'Kitchen', fr: 'Cuisine' } };
    expect(locRoomName(mockT as any, room)).toBe('Cuisine');
  });

  it('fällt auf i18n-Schlüssel zurück wenn keine translations vorhanden', () => {
    const room = { name: 'Küche', key: 'kitchen', translations: null };
    locRoomName(mockT as any, room);
    expect(mockT).toHaveBeenCalledWith('roomNames.kitchen', { defaultValue: 'Küche' });
  });

  it('fällt auf i18n-Schlüssel zurück wenn Sprache nicht in translations', () => {
    mockI18n.language = 'fr';
    const room = { name: 'Küche', key: 'kitchen', translations: { de: 'Küche', en: 'Kitchen' } };
    locRoomName(mockT as any, room);
    expect(mockT).toHaveBeenCalledWith('roomNames.kitchen', { defaultValue: 'Küche' });
  });

  it('gibt name zurück wenn keine translations und kein key', () => {
    const room = { name: 'Eigener Raum', key: null, translations: null };
    expect(locRoomName(mockT as any, room)).toBe('Eigener Raum');
  });
});

describe('locContainerTypeName', () => {
  it('gibt Deutsche Übersetzung zurück', () => {
    const ct = { key: 'drawer', name: 'Schublade', translations: { de: 'Schublade', en: 'Drawer' } };
    expect(locContainerTypeName(mockT as any, ct)).toBe('Schublade');
  });

  it('gibt Englische Übersetzung zurück wenn lang=en', () => {
    mockI18n.language = 'en';
    const ct = { key: 'drawer', name: 'Schublade', translations: { de: 'Schublade', en: 'Drawer' } };
    expect(locContainerTypeName(mockT as any, ct)).toBe('Drawer');
  });

  it('nutzt containerTypeNames i18n-Schlüssel ohne translations', () => {
    const ct = { key: 'drawer', name: 'Schublade', translations: null };
    locContainerTypeName(mockT as any, ct);
    expect(mockT).toHaveBeenCalledWith('containerTypeNames.drawer', { defaultValue: 'Schublade' });
  });

  it('gibt name zurück wenn weder translations noch key', () => {
    const ct = { key: null, name: 'Eigener Typ', translations: null };
    expect(locContainerTypeName(mockT as any, ct)).toBe('Eigener Typ');
  });
});

describe('locTagName', () => {
  it('gibt Deutsche Übersetzung zurück', () => {
    const tag = { key: 'tool', name: 'Werkzeug', translations: { de: 'Werkzeug', en: 'Tools' } };
    expect(locTagName(mockT as any, tag)).toBe('Werkzeug');
  });

  it('gibt Englische Übersetzung zurück wenn lang=en', () => {
    mockI18n.language = 'en';
    const tag = { key: 'tool', name: 'Werkzeug', translations: { de: 'Werkzeug', en: 'Tools' } };
    expect(locTagName(mockT as any, tag)).toBe('Tools');
  });

  it('nutzt tagNames i18n-Schlüssel ohne translations', () => {
    const tag = { key: 'tool', name: 'Werkzeug', translations: null };
    locTagName(mockT as any, tag);
    expect(mockT).toHaveBeenCalledWith('tagNames.tool', { defaultValue: 'Werkzeug' });
  });

  it('nutzt tagNames i18n-Schlüssel wenn keine translations für aktuelle Sprache', () => {
    mockI18n.language = 'fr';
    const tag = { key: 'custom_tag', name: 'Eigener Tag', translations: { de: 'Eigener Tag' } };
    locTagName(mockT as any, tag);
    expect(mockT).toHaveBeenCalledWith('tagNames.custom_tag', { defaultValue: 'Eigener Tag' });
  });
});

describe('locUnitName', () => {
  it('gibt Deutsche Übersetzung zurück', () => {
    const unit = { key: 'piece', name: 'Stück', translations: { de: 'Stück', en: 'piece' } };
    expect(locUnitName(mockT as any, unit)).toBe('Stück');
  });

  it('gibt Englische Übersetzung zurück wenn lang=en', () => {
    mockI18n.language = 'en';
    const unit = { key: 'piece', name: 'Stück', translations: { de: 'Stück', en: 'piece' } };
    expect(locUnitName(mockT as any, unit)).toBe('piece');
  });

  it('gibt dritte Sprache zurück wenn vorhanden', () => {
    mockI18n.language = 'fr';
    const unit = { key: 'piece', name: 'Stück', translations: { de: 'Stück', en: 'piece', fr: 'pièce' } };
    expect(locUnitName(mockT as any, unit)).toBe('pièce');
  });

  it('nutzt unitNames i18n-Schlüssel ohne translations', () => {
    const unit = { key: 'piece', name: 'Stück', translations: null };
    locUnitName(mockT as any, unit);
    expect(mockT).toHaveBeenCalledWith('unitNames.piece', { defaultValue: 'Stück' });
  });
});
