import { describe, it, expect } from 'vitest';
import { chipVariants } from '@/components/ui/Chip';

describe('chipVariants', () => {
  it('neutral uses semantic fg token and a border', () => {
    expect(chipVariants.neutral).toContain('text-fg-muted');
    expect(chipVariants.neutral).toContain('border-line');
  });

  it('info uses cyan tint with mode-aware text', () => {
    expect(chipVariants.info).toContain('text-cyan-700');
    expect(chipVariants.info).toContain('dark:text-cyan-300');
    expect(chipVariants.info).toContain('bg-brand-info-tint');
  });

  it('ai uses violet tint with mode-aware text', () => {
    expect(chipVariants.ai).toContain('text-violet-700');
    expect(chipVariants.ai).toContain('dark:text-violet-300');
    expect(chipVariants.ai).toContain('bg-brand-ai-tint');
  });

  it('active uses orange tint with mode-aware text', () => {
    expect(chipVariants.active).toContain('text-orange-700');
    expect(chipVariants.active).toContain('dark:text-orange-400');
    expect(chipVariants.active).toContain('bg-brand-primary-tint');
  });

  it('every variant includes font-mono base', () => {
    for (const variant of Object.values(chipVariants)) {
      expect(variant).toContain('font-mono');
    }
  });
});
