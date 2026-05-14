# Vessel Design System Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `apps/reminder/index.html` CSS, HTML classes, and minor JS references to use the Vessel design system (`--vs-*` tokens and `.vs-*` component classes) exclusively — no hardcoded hex values, full light/dark/accent theme support.

**Architecture:** Single-file change. The `<style>` block is replaced entirely with Vessel token-based CSS; HTML element classes are updated to use vessel component classes; the JS `BADGE` map and default color constant are updated to match new class names.

**Tech Stack:** Vanilla HTML/CSS/JS · vessel.css design tokens (`--vs-*`) · vessel component classes (`.vs-btn`, `.vs-modal`, `.vs-input`, `.vs-form-group`, etc.)

**Spec:** `docs/superpowers/specs/2026-05-14-vessel-design-system-integration-design.md`

---

### Task 1: Rewrite the `<style>` block

**Files:**
- Modify: `apps/reminder/index.html:9-263` (the entire `<style>` block)

Replace the full `<style>` block (lines 9–263) with the following. This removes all `:root` custom vars, the `.app` card CSS, all custom button/input/modal CSS, and replaces every color with a `--vs-*` token.

- [ ] **Step 1: Replace the `<style>` block**

Replace everything from `<style>` to `</style>` (lines 9–263) with:

```html
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid var(--vs-border);
      background: var(--vs-bg-soft);
      flex-shrink: 0;
    }
    .header-left { display: flex; align-items: center; gap: 8px; }
    .month-title { font-size: 14px; font-weight: 600; color: var(--vs-text); }

    /* ── Calendar grid ── */
    .calendar { padding: 0 12px 8px; flex-shrink: 0; }
    .day-headers {
      display: grid; grid-template-columns: repeat(7, 1fr);
      margin-bottom: 2px;
    }
    .day-header {
      text-align: center;
      font-size: 10px; font-weight: 600; color: var(--vs-text-faint);
      letter-spacing: 0.06em; text-transform: uppercase;
      padding: 8px 0 4px;
    }
    .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }

    .cell {
      min-height: 76px; padding: 4px;
      border-radius: 6px; cursor: pointer;
      transition: background 0.1s;
    }
    .cell:hover { background: var(--vs-bg-hover); }
    .cell.other-month .date-num { color: var(--vs-text-faint); opacity: 0.4; }
    .cell.today { background: var(--vs-bg-soft); }
    .cell.selected { background: var(--vs-bg-active); outline: 1px solid var(--vs-border-strong); }
    .cell.today .date-num { background: var(--vs-accent); color: #fff; font-weight: 700; }
    .date-num {
      font-size: 11px; font-weight: 600; color: var(--vs-text-muted);
      width: 20px; height: 20px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 2px;
    }

    /* ── Event pills ── */
    .pill {
      font-size: 10px; font-weight: 600;
      padding: 2px 5px; border-radius: 4px; margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      display: flex; align-items: center; gap: 3px;
    }
    .pill-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }

    .pill-accent  { background: var(--vs-accent-soft);         color: var(--vs-accent);      }
    .pill-success { background: rgba(76,183,130,0.12);          color: var(--vs-success);     }
    .pill-warning { background: rgba(224,164,88,0.12);          color: var(--vs-warning);     }
    .pill-danger  { background: rgba(226,108,108,0.12);         color: var(--vs-danger);      }
    .pill-info    { background: rgba(106,163,230,0.12);         color: var(--vs-info);        }
    .pill-muted   { background: var(--vs-bg-active);            color: var(--vs-text-muted);  }

    .pill-accent .pill-dot  { background: var(--vs-accent); }
    .pill-success .pill-dot { background: var(--vs-success); }
    .pill-warning .pill-dot { background: var(--vs-warning); }
    .pill-danger .pill-dot  { background: var(--vs-danger); }
    .pill-info .pill-dot    { background: var(--vs-info); }
    .pill-muted .pill-dot   { background: var(--vs-text-faint); }

    .more-link { font-size: 10px; color: var(--vs-text-faint); padding: 1px 4px; }

    /* ── Day panel ── */
    .day-panel {
      border-top: 1px solid var(--vs-border);
      padding: 10px 16px;
      background: var(--vs-bg-soft);
      overflow-y: auto; flex: 1; min-height: 0;
    }
    .day-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 8px;
    }
    .day-panel-title {
      font-size: 11px; font-weight: 600; color: var(--vs-text-muted);
      text-transform: uppercase; letter-spacing: 0.06em;
    }

    .reminder-row {
      display: flex; align-items: center; gap: 10px;
      padding: 7px 10px; border-radius: 7px;
      background: var(--vs-bg-card); border: 1px solid var(--vs-border);
      margin-bottom: 4px;
    }
    .r-time { font-size: 11px; color: var(--vs-text-muted); width: 44px; flex-shrink: 0; font-weight: 600; }
    .r-title { font-size: 13px; color: var(--vs-text); font-weight: 500; flex: 1; cursor: pointer; }
    .r-title:hover { color: var(--vs-accent); }
    .r-badge {
      font-size: 10px; padding: 2px 7px; border-radius: 20px; font-weight: 600; flex-shrink: 0;
      background: var(--vs-bg-active); color: var(--vs-text-muted); border: 1px solid var(--vs-border);
    }
    .r-delete {
      background: none; border: none; color: var(--vs-text-faint); font-size: 13px;
      cursor: pointer; padding: 2px 4px; line-height: 1; flex-shrink: 0;
      transition: color 0.1s;
    }
    .r-delete:hover { color: var(--vs-danger); }

    .empty-day { color: var(--vs-text-muted); font-size: 12px; padding: 8px 0; }

    /* ── Color swatches ── */
    .swatches { display: flex; gap: 8px; }
    .swatch {
      width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
      border: 2px solid transparent; transition: border-color 0.15s;
    }
    .swatch.selected { border-color: var(--vs-text); }
  </style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/reminder/index.html
git commit -m "style: replace custom CSS vars with vessel design tokens"
```

---

### Task 2: Update the HTML shell

**Files:**
- Modify: `apps/reminder/index.html:265-297` (body shell)

The `.app` card wrapper is removed — `body` itself is the flex column container. The three children (`.header`, `.calendar`, `.day-panel`) become direct children of `<body>`. Update button classes so vessel.css handles all button styling.

- [ ] **Step 1: Replace the HTML body shell**

Replace the opening body and app shell (lines 265–297):

```html
<body>
  <div class="header">
    <div class="header-left">
      <button class="vs-btn vs-btn-ghost vs-btn-sm" id="prev-month">‹</button>
      <div class="month-title" id="month-title">May 2026</div>
      <button class="vs-btn vs-btn-ghost vs-btn-sm" id="next-month">›</button>
      <button class="vs-btn vs-btn-ghost vs-btn-sm" id="go-today">Today</button>
    </div>
    <button class="vs-btn vs-btn-primary vs-btn-sm" id="new-reminder">＋ New Reminder</button>
  </div>

  <div class="calendar">
    <div class="day-headers">
      <div class="day-header">Sun</div>
      <div class="day-header">Mon</div>
      <div class="day-header">Tue</div>
      <div class="day-header">Wed</div>
      <div class="day-header">Thu</div>
      <div class="day-header">Fri</div>
      <div class="day-header">Sat</div>
    </div>
    <div class="grid" id="calendar-grid"></div>
  </div>

  <div class="day-panel" id="day-panel">
    <div class="day-panel-header">
      <div class="day-panel-title" id="day-panel-title">Select a day</div>
      <button class="vs-btn vs-btn-ghost vs-btn-sm" id="panel-add">＋ Add reminder</button>
    </div>
    <div id="day-panel-list"></div>
  </div>
```

- [ ] **Step 2: Commit**

```bash
git add apps/reminder/index.html
git commit -m "style: remove app card wrapper, apply vessel button classes"
```

---

### Task 3: Restructure the modal HTML

**Files:**
- Modify: `apps/reminder/index.html:299-345` (modal section)

Replace the flat `.modal` structure with the vessel modal structure (`.vs-modal-overlay`, `.vs-modal`, `.vs-modal-header`, `.vs-modal-body`, `.vs-modal-footer`). Wrap each form field in `.vs-form-group` + `.vs-label`. Add `.vs-input` / `.vs-select` to inputs. Replace swatches with 5 semantic vessel colors (accent, success, warning, danger, info) + muted.

- [ ] **Step 1: Replace the modal HTML**

Replace lines 299–345 with:

```html
  <div class="vs-modal-overlay hidden" id="modal-overlay">
    <div class="vs-modal">
      <div class="vs-modal-header" id="modal-title">New Reminder</div>
      <div class="vs-modal-body">
        <div class="vs-form-group">
          <label class="vs-label">Title</label>
          <input class="vs-input" type="text" id="f-title" placeholder="Reminder title" />
        </div>
        <div class="vs-form-group">
          <label class="vs-label">Notes</label>
          <textarea class="vs-input" id="f-notes" placeholder="Optional notes"></textarea>
        </div>
        <div style="display:flex;gap:10px">
          <div class="vs-form-group" style="flex:1">
            <label class="vs-label">Date</label>
            <input class="vs-input" type="date" id="f-date" />
          </div>
          <div class="vs-form-group" style="flex:1">
            <label class="vs-label">Time</label>
            <select class="vs-select" id="f-time"></select>
          </div>
        </div>
        <div class="vs-form-group">
          <label class="vs-label">Recurrence</label>
          <select class="vs-select" id="f-recurrence">
            <option value="none">Once</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div class="vs-form-group">
          <label class="vs-label">Color</label>
          <div class="swatches" id="swatches">
            <div class="swatch selected" style="background:var(--vs-accent)"      data-color="accent"></div>
            <div class="swatch"          style="background:var(--vs-success)"     data-color="success"></div>
            <div class="swatch"          style="background:var(--vs-warning)"     data-color="warning"></div>
            <div class="swatch"          style="background:var(--vs-danger)"      data-color="danger"></div>
            <div class="swatch"          style="background:var(--vs-info)"        data-color="info"></div>
            <div class="swatch"          style="background:var(--vs-text-muted)"  data-color="muted"></div>
          </div>
        </div>
      </div>
      <div class="vs-modal-footer">
        <button class="vs-btn vs-btn-ghost" id="modal-cancel">Cancel</button>
        <button class="vs-btn vs-btn-primary" id="modal-save">Save</button>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Commit**

```bash
git add apps/reminder/index.html
git commit -m "style: migrate modal to vessel modal structure and form components"
```

---

### Task 4: Update JS class references

**Files:**
- Modify: `apps/reminder/index.html:473` (BADGE map)
- Modify: `apps/reminder/index.html:518` (default color in openModal)
- Modify: `apps/reminder/index.html:547` (default color in saveModal)

Three JS changes are needed because the HTML class names and `data-color` values changed.

**Note on pill rendering:** The JS already builds pill classes as `pill-${r.color}` (unchanged). Because the new swatch `data-color` values are exactly `accent`, `success`, `warning`, `danger`, `info`, `muted`, the stored color strings will match the new CSS class names (`pill-accent`, `pill-success`, etc.) automatically — no additional mapping needed.

1. The `BADGE` object produced classes like `badge-daily` — those CSS classes are gone. The new `.r-badge` style is uniform; only the label text matters.
2. The default color was `'sky'`; the new swatch is `data-color="accent"`.

- [ ] **Step 1: Replace the BADGE map and rendering (line ~473)**

Find:
```js
    const BADGE = { daily: 'badge-daily', weekly: 'badge-weekly', monthly: 'badge-monthly', none: 'badge-none' }
    const BADGE_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', none: 'Once' }
```

Replace with:
```js
    const BADGE_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', none: 'Once' }
```

Then find the reminder row innerHTML (line ~501):
```js
          <div class="r-badge ${BADGE[r.recurrence]}">${BADGE_LABEL[r.recurrence]}</div>
```

Replace with:
```js
          <div class="r-badge">${BADGE_LABEL[r.recurrence]}</div>
```

- [ ] **Step 2: Update default color in openModal (line ~518)**

Find:
```js
      const color = reminder?.color ?? 'sky'
```

Replace with:
```js
      const color = reminder?.color ?? 'accent'
```

- [ ] **Step 3: Update default color in saveModal (line ~547)**

Find:
```js
        color: selectedSwatch?.dataset.color ?? 'sky',
```

Replace with:
```js
        color: selectedSwatch?.dataset.color ?? 'accent',
```

- [ ] **Step 4: Commit**

```bash
git add apps/reminder/index.html
git commit -m "style: update JS badge map and default color to vessel semantic names"
```

---

### Task 5: Build, verify, and package

- [ ] **Step 1: Build the ZIP**

```bash
npm run build
```

Expected output:
```
  adding: manifest.json ...
  adding: icon.svg ...
  adding: apps/ ...
  adding: apps/reminder/ ...
  adding: apps/reminder/index.html ...

Built: dist/vessel-reminder.zip
```

- [ ] **Step 2: Install in Vessel and verify visually**

Install `dist/vessel-reminder.zip` in the Vessel app. Check:
- App fills the iframe flush (no outer card/border-radius)
- Header uses `--vs-bg-soft` background, buttons look native
- Calendar cells highlight with `--vs-accent` on today's date
- Event pills show in accent/success/warning/danger/info colors
- Day panel renders with unified badge style
- Modal uses vessel modal chrome (header/body/footer sections)
- Inputs and selects use vessel input style with accent focus ring
- Color swatches show 6 vessel semantic colors
- Light/dark theme and accent color changes apply automatically

- [ ] **Step 3: Final commit**

```bash
git add apps/reminder/index.html
git commit -m "feat: integrate vessel design system — full CSS and component migration"
```
