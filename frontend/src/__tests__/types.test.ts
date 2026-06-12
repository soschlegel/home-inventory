import { describe, it, expect } from 'vitest';
import { CONDITION_LABELS, CONDITION_COLORS } from '../types';

const CONDITIONS = ['NEW', 'GOOD', 'WORN', 'BROKEN'] as const;

describe('CONDITION_LABELS', () => {
  it('enthält alle vier Zustände', () => {
    CONDITIONS.forEach((c) => expect(CONDITION_LABELS[c]).toBeTruthy());
  });

  it('hat die korrekten deutschen Bezeichnungen', () => {
    expect(CONDITION_LABELS.NEW).toBe('Neu');
    expect(CONDITION_LABELS.GOOD).toBe('Gut');
    expect(CONDITION_LABELS.WORN).toBe('Abgenutzt');
    expect(CONDITION_LABELS.BROKEN).toBe('Defekt');
  });
});

describe('CONDITION_COLORS', () => {
  it('enthält alle vier Zustände', () => {
    CONDITIONS.forEach((c) => expect(CONDITION_COLORS[c]).toBeTruthy());
  });

  it('verwendet die richtigen Farben als Tailwind-Klassen', () => {
    expect(CONDITION_COLORS.NEW).toContain('green');
    expect(CONDITION_COLORS.GOOD).toContain('blue');
    expect(CONDITION_COLORS.WORN).toContain('yellow');
    expect(CONDITION_COLORS.BROKEN).toContain('red');
  });

  it('enthält sowohl bg- als auch text-Klassen', () => {
    CONDITIONS.forEach((c) => {
      expect(CONDITION_COLORS[c]).toMatch(/bg-\w+/);
      expect(CONDITION_COLORS[c]).toMatch(/text-\w+/);
    });
  });
});
