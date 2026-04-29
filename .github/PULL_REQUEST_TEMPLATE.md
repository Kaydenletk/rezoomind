<!--
  Thanks for the PR. Keep the title short (< 70 chars); use this body for detail.
  Title format: <type>: <description>  (feat / fix / refactor / docs / test / chore / perf / ci)
-->

## Summary

<!-- What changed and WHY. 1–3 sentences. Link to spec/plan under docs/superpowers/ if relevant. -->

## Screenshots / Recordings

<!-- For UI changes, include before/after at 320, 768, and 1440 widths.
     For both light and dark themes. Delete if not applicable. -->

## Test plan

- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] `npm test` passes (if tests changed/added)
- [ ] Manually verified in the browser (list routes touched: e.g. `/`, `/insights`, `/login`)
- [ ] Ran gstack `/review` on the diff
- [ ] Ran gstack `/qa` for user-facing changes

## Protected surfaces

- [ ] I did **not** modify any file in the "Protected Landing Page Files" or
      "Protected Smart-Feed Files" tables in `CLAUDE.md` without prior approval.
- [ ] No pure-black backgrounds or hand-coded `bg-black` / `bg-stone-950`
      introduced — semantic `bg-surface*` tokens used.

## Risk / rollout

<!-- Low-risk / medium / high. Mention any feature flags, migrations, or cron changes. -->
