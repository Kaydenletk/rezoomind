# Auth Theme Alignment Design

## Context

Rezoomind currently uses one visual system for the public homepage/dashboard flow and a separate terminal-heavy system for `/login` and `/signup`. That creates a visible break in brand perception when users move from browsing jobs to authentication.

The goal is to align authentication with the homepage/dashboard system while preserving the user's active theme choice. If the user is in light mode, auth should stay light. If the user is in dark mode, auth should stay dark.

## Goal

Make the transition from homepage to login/signup feel like the same product:

- Use the same light/dark palette as homepage and dashboard
- Respect the existing persisted theme state across route changes
- Reduce copy density in auth
- Shift auth visuals toward clean, premium, easy-to-scan cards

## Scope

In scope:

- `app/(auth)/layout.tsx`
- `app/(auth)/login/LoginClient.tsx`
- `app/(auth)/signup/SignupClient.tsx`
- Shared styling choices already controlled by `app/layout.tsx`

Out of scope:

- New auth flows
- Validation logic changes
- Dashboard information architecture changes
- Theme storage redesign

## Design Direction

### Visual System

Auth should use the same shell tokens already established on homepage/dashboard:

- Page background: `stone-50` in light, `stone-950` in dark
- Card background: `white` in light, `stone-900` in dark
- Card border: `stone-200` in light, `stone-800` in dark
- Primary text: `stone-950` in light, `stone-50/100` in dark
- Secondary text: `stone-500/600` in light, `stone-300/400` in dark
- Accent and CTA: `orange-600` in light, `orange-500` in dark

Auth should no longer present as a separate terminal app. The heavy faux window chrome, dark-only backdrop, and dense monospace styling should be removed or reduced.

### Brand Expression

The auth screens should feel:

- Clean
- Premium
- Light on copy
- Easy to understand at a glance

Brand character should remain through:

- Orange accent usage
- Tight typography hierarchy
- Selective monospace usage for small labels or supporting UI only

## Component Changes

### Auth Layout

`app/(auth)/layout.tsx` should align with homepage/dashboard shell behavior:

- Use the same responsive, token-driven background as the root app
- Replace the dark-only grid-heavy shell with a cleaner shared page shell
- Keep brand continuity in header/footer, but in a lighter and less stylized presentation
- Avoid visually implying that auth is a separate subsystem

### Login Card

`app/(auth)/login/LoginClient.tsx` should become a dashboard-style auth card:

- Remove faux executable title bar styling
- Use a clean bordered card with generous whitespace
- Keep headline short and plain
- Keep supporting copy to one short line
- Preserve current fields and submit behavior
- Keep status feedback, but render it in a cleaner way

### Signup Card

`app/(auth)/signup/SignupClient.tsx` should follow the same card system as login:

- Same spacing, border, surface, and typography rules
- Reduced copy density
- Consistent field treatment with login
- Consistent CTA hierarchy with login

## Theme Behavior

The existing theme bootstrap in `app/layout.tsx` remains the source of truth:

- `localStorage.theme` continues to drive the root `dark` class
- Route changes between homepage, auth, and logged-in pages must not override the user's selected theme
- Auth must rely on the same `dark:` class behavior already used by homepage/dashboard components

No separate auth theme state should be introduced.

## Data Flow

No backend or API changes are required.

Theme flow remains:

1. Root layout reads `localStorage.theme` before hydration
2. The `dark` class is applied to `document.documentElement`
3. Homepage, auth, and post-login screens render against the same root class
4. `ThemeToggle` continues updating the same persisted value

## Error Handling

Auth validation and network error behavior should remain functionally unchanged.

Only presentation changes:

- Keep inline success/loading/error note area
- Maintain accessible visual contrast in both themes
- Ensure disabled and loading states still read clearly in light and dark mode

## Testing

Verify:

1. Homepage in light mode -> open `/login` or `/signup` -> auth remains light
2. Homepage in dark mode -> open `/login` or `/signup` -> auth remains dark
3. Toggle theme, then navigate between `/`, `/login`, `/signup`, and `/feed` -> theme remains consistent
4. Login and signup cards visually match homepage/dashboard shell
5. Status, disabled, hover, and focus states remain readable in both themes

## Recommendation

Implement the shared-shell approach:

- Homepage/dashboard remains the visual source of truth
- Auth adopts the same system rather than keeping a distinct terminal aesthetic
- Changes stay intentionally narrow to improve cohesion without redesigning the full auth experience
