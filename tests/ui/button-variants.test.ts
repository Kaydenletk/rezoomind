import { describe, it, expect } from 'vitest';
import { buttonVariants } from '@/components/ui/Button';

describe('buttonVariants', () => {
  it('primary-solid uses solid orange bg with dark text', () => {
    expect(buttonVariants['primary-solid']).toContain('bg-brand-primary');
    expect(buttonVariants['primary-solid']).toContain('text-stone-950');
  });

  it('primary-tint uses orange-tint bg', () => {
    expect(buttonVariants['primary-tint']).toContain('bg-brand-primary-tint');
    expect(buttonVariants['primary-tint']).toContain('text-orange-500');
  });

  it('ai variant uses violet tint', () => {
    expect(buttonVariants.ai).toContain('bg-brand-ai-tint');
    expect(buttonVariants.ai).toContain('text-violet-300');
  });

  it('danger variant uses red border, transparent bg', () => {
    expect(buttonVariants.danger).toContain('text-red-400');
    expect(buttonVariants.danger).toContain('bg-transparent');
  });

  it('ghost variant is text-only with no background class', () => {
    expect(buttonVariants.ghost).toContain('text-stone-500');
    expect(buttonVariants.ghost).not.toMatch(/\bbg-(?!transparent)/);
  });

  it('secondary has a visible border and muted text', () => {
    expect(buttonVariants.secondary).toContain('border');
    expect(buttonVariants.secondary).toContain('text-stone-400');
  });

  it('legacy "primary" is aliased to primary-tint', () => {
    expect(buttonVariants.primary).toBe(buttonVariants['primary-tint']);
  });
});
