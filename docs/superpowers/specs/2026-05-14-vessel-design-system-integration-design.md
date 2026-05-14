# Vessel Design System Integration

**Date:** 2026-05-14  
**Status:** Approved

## Goal

Rewrite the vessel-reminder UI so it looks and feels native to Vessel. Every color, spacing, and component token comes from the Vessel design system (`vessel://sdk.css`). No hardcoded hex values remain in the app.

## Scope

Full rebuild of `apps/reminder/index.html` CSS — layout and JS logic unchanged.

## Design Decisions

### App shell
Remove the centered `.app` card (border-radius, box-shadow, fixed width). The cargo runs inside a Vessel iframe — the host manages window chrome. The app fills the full viewport using `--vs-bg` as body background.

### Colors — remove all custom variables
Delete the `:root` block defining `--bg`, `--surface`, `--panel`, `--card`, `--border`, `--text`, `--sky`, `--green`, etc. Replace every usage with the corresponding `--vs-*` token:

| Old | New |
|-----|-----|
| `--bg` | `--vs-bg` |
| `--surface` | `--vs-bg-soft` |
| `--panel` | `--vs-bg-soft` |
| `--card` | `--vs-bg-card` |
| `--border` | `--vs-border` / `--vs-border-strong` |
| `--text` | `--vs-text` |
| `--text-sec` | `--vs-text-muted` |
| `--text-muted` | `--vs-text-faint` |
| `--sky` (accent) | `--vs-accent` |

### Buttons
Replace all custom button classes with vessel component classes:
- `.nav-btn`, `.today-btn` → `.vs-btn.vs-btn-ghost.vs-btn-sm`
- `.add-btn` → `.vs-btn.vs-btn-primary.vs-btn-sm`
- `.panel-add-btn` → `.vs-btn.vs-btn-ghost.vs-btn-sm`
- `.btn-cancel` → `.vs-btn.vs-btn-ghost`
- `.btn-save` → `.vs-btn.vs-btn-primary`
- `.r-delete` → keep minimal custom style using `--vs-text-faint` / `--vs-danger`

### Form elements
Replace all custom input/select/label CSS with vessel classes:
- `<input>`, `<textarea>`, `<select>` → add `.vs-input` / `.vs-select`
- `.field` → `.vs-form-group`
- `.field label` → `.vs-label`

### Modal
Replace custom `.modal` / `.modal-overlay` with vessel modal structure:
- `.modal-overlay` → `.vs-modal-overlay`
- `.modal` → `.vs-modal`
- Add `.vs-modal-header`, `.vs-modal-body`, `.vs-modal-footer` wrappers

### Calendar cells
Keep custom grid layout (vessel.css has no calendar component). Replace all color references with `--vs-*` tokens:
- Cell hover → `--vs-bg-hover`
- Cell selected → `--vs-bg-active` + `outline: 1px solid --vs-border-strong`
- Today cell → `--vs-bg-soft`; date number → `--vs-accent` background, `#fff` text *(vessel.css has no on-accent text token; `#fff` is a justified exception)*
- Other-month date numbers → `--vs-text-faint` at reduced opacity

### Event pills
Replace 6 hardcoded color variants with 6 vessel semantic variants:

| Old | New |
|-----|-----|
| `pill-sky` | `pill-accent` → `--vs-accent` |
| `pill-green` | `pill-success` → `--vs-success` |
| `pill-amber` | `pill-warning` → `--vs-warning` |
| `pill-orange` | `pill-danger` → `--vs-danger` |
| `pill-rose` | `pill-danger` (merged) |
| `pill-violet` | `pill-info` → `--vs-info` |

Color picker swatches in the modal map to the same 5 semantic colors + muted.

**Legacy color fallback (JS):** Existing stored reminders may have `color` values of `"rose"` or `"orange"` (the old names). The pill-rendering JS must map these to `"danger"` as a fallback so old data doesn't break. This is a small JS change but necessary for correctness — add a `normalizeColor(c)` helper that maps `rose → danger`, `orange → danger`, `violet → info`, `sky → accent`, `green → success`, `amber → warning`, and passes others through unchanged.

### Reminder rows (day panel)
- Row background: `--vs-bg-card`, border: `--vs-border`
- Time: `--vs-text-muted`
- Title: `--vs-text`
- Badge: `--vs-bg-active` background, `--vs-text-muted` text, `--vs-border` border

### Theme / light mode
Because `vessel://sdk.js` automatically sets `data-theme` and `data-accent` on `<html>` based on the host app's settings, the UI automatically supports light mode and all accent colors with zero extra code.

## Files Changed

- `apps/reminder/index.html` — CSS rewrite + small JS `normalizeColor()` helper for legacy stored color values

## Out of Scope

- Layout changes
- New features
- JS logic changes (except `normalizeColor()` helper)
- Notes field (already exists, no change)
