# Token Drift Audit — 2026-04-16

Baseline counts for legacy patterns. The `tests/ui/token-drift.test.ts` guard (Task 6) will fail if any count INCREASES beyond these numbers. Migration PRs in Phases 1–6 will drive these to zero.

| Pattern | Count | Notes |
|---------|-------|-------|
| `text-[9px]` | 22 | retiring — use `--text-caption` (10px) |
| `text-[11px]` | 94 | keep as heading-sm? no — retire |
| `rounded-[10px]` | 38 | retire — cards go `rounded-none`, buttons `rounded-sm` |
| `rounded-[14px]` | 2 | retire — same |
| `rounded-md` | 18 | retire — replace with `rounded-sm` (2px) |
| `rounded-lg` | 5 | retire |
| `rounded-xl` | 0 | retire |

Total legacy pattern occurrences: 179

The drift guard test asserts the sum does not increase.
