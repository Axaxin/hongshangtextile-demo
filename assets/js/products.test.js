import { describe, it, expect } from 'vitest';
import { matchesCategory } from './products.js';

describe('matchesCategory', () => {
  it('returns true when category is "all"', () => {
    expect(matchesCategory('cotton-linen', 'all')).toBe(true);
  });

  it('returns true when card category matches selected', () => {
    expect(matchesCategory('jacquard', 'jacquard')).toBe(true);
  });

  it('returns false when categories differ', () => {
    expect(matchesCategory('rib', 'jacquard')).toBe(false);
  });
});
