# Token Drift Audit — 2026-04-16 (rebased 2026-04-17 post-Phase-1)

Baseline counts for legacy patterns. The `tests/ui/token-drift.test.ts` guard (Task 6) will fail if any count INCREASES beyond these numbers. Migration PRs in Phases 2–6 will drive these to zero.

**Rebased:** Phase 1 landing redesign shipped (commit `32da9da`) before the drift guard was in place, bumping `text-[9px]` and `text-[11px]` counts. Baseline was frozen at post-merge state to unblock the guard. Future phases must only DECREASE these.

| Pattern | Count | Δ from 2026-04-16 | Notes |
|---------|-------|-------------------|-------|
| `text-[9px]` | 28 | +6 | retiring — use `--text-caption` (10px) |
| `text-[11px]` | 98 | +4 | retire — use `--text-label` |
| `rounded-[10px]` | 38 | 0 | retire — cards go `rounded-none`, buttons `rounded-sm` |
| `rounded-[14px]` | 2 | 0 | retire — same |
| `rounded-md` | 18 | 0 | retire — replace with `rounded-sm` (2px) |
| `rounded-lg` | 5 | 0 | retire |
| `rounded-xl` | 0 | 0 | retire |

Total legacy pattern occurrences: 189 (was 179).

The drift guard test asserts each pattern's count does not exceed its baseline.
