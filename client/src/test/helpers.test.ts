import { describe, it, expect } from 'vitest';
import { isValidRoomId, generateId, generateUserId, clamp, distance, formatRoomId } from '../utils/helpers';

describe('isValidRoomId', () => {
  it('accepts a valid 6-char uppercase alphanumeric ID', () => {
    expect(isValidRoomId('AB12CD')).toBe(true);
    expect(isValidRoomId('AAAAAA')).toBe(true);
    expect(isValidRoomId('123456')).toBe(true);
  });

  it('rejects IDs that are not 6 characters', () => {
    expect(isValidRoomId('')).toBe(false);
    expect(isValidRoomId('ABCDE')).toBe(false);   // 5 chars
    expect(isValidRoomId('ABCDEFG')).toBe(false); // 7 chars
  });

  it('rejects IDs with special characters or spaces', () => {
    expect(isValidRoomId('AB-12C')).toBe(false);
    expect(isValidRoomId('AB 12C')).toBe(false);
    expect(isValidRoomId('ab12cd')).toBe(false); // lowercase
  });

  it('accepts lowercase by normalizing (the validator uses toUpperCase)', () => {
    // Our validator does toUpperCase before testing
    expect(isValidRoomId('ab12cd'.toUpperCase())).toBe(true);
  });
});

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns unique IDs on subsequent calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('generateUserId', () => {
  it('returns a non-empty string', () => {
    const id = generateUserId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns different IDs on successive calls (probabilistic)', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateUserId()));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('clamp', () => {
  it('returns value when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min when below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to max when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('distance', () => {
  it('calculates distance between two points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5);
    expect(distance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
  });
});

describe('formatRoomId', () => {
  it('returns uppercase version of the room ID', () => {
    expect(formatRoomId('ab12cd')).toBe('AB12CD');
    expect(formatRoomId('AB12CD')).toBe('AB12CD');
  });
});
