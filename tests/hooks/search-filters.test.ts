import { describe, it, expect } from 'vitest';
import { parseFiltersParam, serializeFilters } from '@/hooks/useSearchFilters';

describe('parseFiltersParam', () => {
  it('returns empty set for null input', () => {
    expect(parseFiltersParam(null)).toEqual(new Set());
  });

  it('returns empty set for empty string', () => {
    expect(parseFiltersParam('')).toEqual(new Set());
  });

  it('splits csv and trims whitespace', () => {
    expect(parseFiltersParam('a,b , c')).toEqual(new Set(['a', 'b', 'c']));
  });

  it('dedupes duplicate entries', () => {
    expect(parseFiltersParam('a,b,a,c,b')).toEqual(new Set(['a', 'b', 'c']));
  });
});

describe('serializeFilters', () => {
  it('returns null for empty set', () => {
    expect(serializeFilters(new Set())).toBeNull();
  });

  it('joins sorted csv', () => {
    expect(serializeFilters(new Set(['b', 'a', 'c']))).toBe('a,b,c');
  });
});
