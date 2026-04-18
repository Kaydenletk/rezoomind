# Token Drift Audit — 2026-04-16 (rebased 2026-04-18 post-Commit-1)

Baseline counts for legacy patterns. The `tests/ui/token-drift.test.ts` guard (Task 6) will fail if any count INCREASES beyond these numbers. Migration PRs in Phases 2–6 must only DECREASE these.

**Rebase history:**
- `2026-04-16`: original baseline (179 total).
- `2026-04-17`: rebased after Phase 1 landing shipped (189 total, +10 from new landing components that used `text-[11px]` / `text-[9px]`).
- `2026-04-18`: rebased after Commit 1 of Phase 2a (Landing v2 light-first rewrite). `text-[11px]` dropped -5 as rewritten components use the `text-label` @theme token instead.

| Pattern | Count | Δ from 2026-04-17 | Notes |
|---------|-------|-------------------|-------|
| `text-[9px]` | 28 | 0 | retiring — use `text-caption` (10px token) |
| `text-[11px]` | 93 | -5 | retiring — use `text-label` (11px token) |
| `rounded-[10px]` | 38 | 0 | retire — cards go `rounded-none`, buttons `rounded-sm` |
| `rounded-[14px]` | 2 | 0 | retire — same |
| `rounded-md` | 18 | 0 | retire — replace with `rounded-sm` (2px) |
| `rounded-lg` | 5 | 0 | retire |
| `rounded-xl` | 0 | 0 | retire |

Total legacy pattern occurrences: 184 (was 189).

The drift guard test asserts each pattern's count does not exceed its baseline.
