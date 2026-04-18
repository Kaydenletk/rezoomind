import { describe, it, expect } from 'vitest';
import { buttonVariants } from '@/components/ui/Button';

describe('buttonVariants', () => {
  it('primary-solid uses solid orange bg with readable text', () => {
    expect(buttonVariants['primary-solid']).toContain('bg-brand-primary');
    expect(buttonVariants['primary-solid']).toContain('text-white');
  });

  it('primary-tint uses orange-tint bg', () => {
    expect(buttonVariants['primary-tint']).toContain('bg-brand-primary-tint');
    expect(buttonVariants['primary-tint']).toContain('text-orange-500');
  });

  it('ai variant uses violet tint with mode-aware text', () => {
    expect(buttonVariants.ai).toContain('bg-brand-ai-tint');
    expect(buttonVariants.ai).toContain('text-violet-700');
    expect(buttonVariants.ai).toContain('dark:text-violet-300');
  });

  it('danger variant uses red text, transparent bg', () => {
    expect(buttonVariants.danger).toContain('text-red-600');
    expect(buttonVariants.danger).toContain('dark:text-red-400');
    expect(buttonVariants.danger).toContain('bg-transparent');
  });

  it('ghost variant is text-only with semantic fg token', () => {
    expect(buttonVariants.ghost).toContain('text-fg-muted');
    expect(buttonVariants.ghost).not.toMatch(/\bbg-(?!transparent)/);
  });

  it('secondary has a semantic border and muted fg text', () => {
    expect(buttonVariants.secondary).toContain('border-line');
    expect(buttonVariants.secondary).toContain('text-fg-muted');
  });

  it('legacy "primary" is aliased to primary-tint', () => {
    expect(buttonVariants.primary).toBe(buttonVariants['primary-tint']);
  });
});
