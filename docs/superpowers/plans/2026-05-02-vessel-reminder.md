# Vessel Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a calendar-based reminder Vessel cargo that shows reminders in a monthly grid, lets users create/edit/delete them via a modal, and fires system notifications every 5 minutes when reminders are due.

**Architecture:** Single Vessel cargo with one app (`reminder`). The entire app is one self-contained `apps/reminder/index.html` file with inline CSS and an ES module script. State is persisted via the Vessel SDK `storage` API. A `setInterval` loop polls for due reminders and fires `notifications.send()`.

**Tech Stack:** Vanilla HTML, CSS, ES module JavaScript. `@vessel-aircodr/sdk` (copied to `sdk/index.js` by `scripts/pack.js`).

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `manifest.json` | Create | Cargo metadata, app permissions |
| `package.json` | Create | npm metadata, build script entry |
| `scripts/pack.js` | Create | Copies SDK bundle, zips cargo to `dist/` |
| `apps/reminder/index.html` | Create | Entire app — HTML, CSS, JS in one file |

`apps/reminder/index.html` internal sections (in order):
- `<style>` — all CSS, Vessel color tokens as CSS custom properties
- HTML skeleton — header, calendar grid placeholder, day panel placeholder, modal placeholder
- `<script type="module">` with these logical sections:
  1. SDK imports + `await ready()`
  2. Storage helpers — `loadReminders()`, `saveReminders()`
  3. Utility functions — `uuid()`, `toISODate()`, `currentSlot()`, `isDueOn()`
  4. State — `let reminders`, `let selectedDate`, `let viewYear`, `let viewMonth`, `let editingId`
  5. Renderers — `renderCalendar()`, `renderDayPanel()`, `renderModal()`
  6. Event handlers — wired via event delegation on `document`
  7. Notification poller — `startPoller()`
  8. Init — load reminders, render, start poller

---

## Task 1: Project Scaffold

**Files:**
- Create: `manifest.json`
- Create: `package.json`
- Create: `scripts/pack.js`

- [ ] **Step 1: Create `manifest.json`**

```json
{
  "id": "vessel-reminder",
  "name": "Vessel Reminder",
  "version": "1.0.0",
  "author": "franck.anso@gmail.com",
  "description": "A calendar-based reminder app with system notifications",
  "icon": "🔔",
  "apps": [
    {
      "id": "reminder",
      "name": "Reminder",
      "permissions": ["storage", "notifications"]
    }
  ]
}
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "vessel-reminder",
  "version": "1.0.0",
  "description": "A Vessel cargo — calendar reminder app",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "node scripts/pack.js"
  },
  "dependencies": {
    "@vessel-aircodr/sdk": "^0.1.0"
  }
}
```

- [ ] **Step 3: Create `scripts/pack.js`**

```js
#!/usr/bin/env node
import { execSync } from 'child_process'
import { mkdirSync, existsSync, unlinkSync, copyFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'dist')
const outFile = resolve(outDir, 'vessel-reminder.zip')

const sdkDir = resolve(root, 'sdk')
if (!existsSync(sdkDir)) mkdirSync(sdkDir)
copyFileSync(
  resolve(root, 'node_modules/@vessel-aircodr/sdk/dist/bundle.js'),
  resolve(sdkDir, 'index.js')
)

if (!existsSync(outDir)) mkdirSync(outDir)
if (existsSync(outFile)) unlinkSync(outFile)

execSync(`zip -r "${outFile}" manifest.json sdk/ apps/`, { cwd: root, stdio: 'inherit' })
console.log(`\nBuilt: dist/vessel-reminder.zip`)
```

- [ ] **Step 4: Install dependencies**

```bash
npm install
```

Expected: `node_modules/@vessel-aircodr/sdk/` created.

- [ ] **Step 5: Create `apps/reminder/` directory and empty `index.html`**

Create `apps/reminder/index.html` with just:
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Reminder</title></head><body></body></html>
```

- [ ] **Step 6: Verify build works**

```bash
npm run build
```

Expected: `dist/vessel-reminder.zip` created with `manifest.json`, `sdk/index.js`, `apps/reminder/index.html` inside.

- [ ] **Step 7: Commit**

```bash
git add manifest.json package.json package-lock.json scripts/pack.js apps/reminder/index.html
git commit -m "feat: scaffold vessel-reminder cargo"
```

---

## Task 2: HTML Skeleton + CSS

**Files:**
- Modify: `apps/reminder/index.html`

- [ ] **Step 1: Replace `index.html` with full HTML skeleton and CSS**

Write the complete `apps/reminder/index.html` with inline `<style>`. Use Vessel color tokens as CSS custom properties. The HTML structure should be:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reminder</title>
  <style>
    :root {
      --bg:        #080f18;
      --surface:   #0d1620;
      --panel:     #0f1e2e;
      --card:      #132233;
      --border:    #1e3048;
      --text:      #e8eef5;
      --text-sec:  #7a9ab8;
      --text-muted:#3a5570;
      --sky:       #38bdf8;
      --green:     #34d399;
      --amber:     #fbbf24;
      --orange:    #fb923c;
      --rose:      #f87171;
      --violet:    #a78bfa;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      height: 100vh;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .app {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      width: 860px;
      max-height: 96vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 20px;
      border-bottom: 1px solid var(--border);
      background: var(--panel);
      flex-shrink: 0;
    }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .month-title { font-size: 15px; font-weight: 700; }

    button {
      cursor: pointer;
      font-family: inherit;
      border: none;
      transition: opacity 0.15s;
    }
    button:hover { opacity: 0.8; }

    .nav-btn {
      width: 28px; height: 28px; border-radius: 7px;
      border: 1px solid var(--border) !important;
      background: var(--card);
      color: var(--text-sec);
      font-size: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .today-btn {
      padding: 5px 12px; border-radius: 7px;
      border: 1px solid var(--border) !important;
      background: var(--card);
      font-size: 12px; color: var(--text-sec); font-weight: 500;
    }
    .add-btn {
      padding: 6px 14px; border-radius: 7px;
      background: var(--sky);
      color: var(--surface);
      font-size: 12px; font-weight: 700;
    }

    /* ── Calendar grid ── */
    .calendar { padding: 0 14px 10px; flex-shrink: 0; }

    .day-headers {
      display: grid; grid-template-columns: repeat(7, 1fr);
      margin-bottom: 2px;
    }
    .day-header {
      text-align: center;
      font-size: 10px; font-weight: 700; color: var(--text-muted);
      letter-spacing: 0.7px; text-transform: uppercase;
      padding: 9px 0 5px;
    }
    .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }

    .cell {
      min-height: 80px; padding: 5px 4px;
      border-radius: 7px; cursor: pointer;
      transition: background 0.1s;
    }
    .cell:hover { background: var(--card); }
    .cell.other-month .date-num { color: var(--border); }
    .cell.today { background: var(--panel); }
    .cell.selected { background: var(--card); outline: 1px solid var(--border); }
    .cell.today .date-num {
      background: var(--sky); color: var(--surface); font-weight: 800;
    }
    .date-num {
      font-size: 12px; font-weight: 600; color: var(--text-sec);
      width: 22px; height: 22px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 3px;
    }

    /* ── Event pills ── */
    .pill {
      font-size: 10px; font-weight: 600;
      padding: 2px 5px; border-radius: 4px; margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      display: flex; align-items: center; gap: 3px;
    }
    .pill-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }

    .pill-sky    { background: rgba(56,189,248,0.15); color: var(--sky); }
    .pill-green  { background: rgba(52,211,153,0.15); color: var(--green); }
    .pill-amber  { background: rgba(251,191,36,0.15); color: var(--amber); }
    .pill-orange { background: rgba(251,146,60,0.15); color: var(--orange); }
    .pill-rose   { background: rgba(248,113,113,0.15); color: var(--rose); }
    .pill-violet { background: rgba(167,139,250,0.15); color: var(--violet); }

    .pill-sky .pill-dot    { background: var(--sky); }
    .pill-green .pill-dot  { background: var(--green); }
    .pill-amber .pill-dot  { background: var(--amber); }
    .pill-orange .pill-dot { background: var(--orange); }
    .pill-rose .pill-dot   { background: var(--rose); }
    .pill-violet .pill-dot { background: var(--violet); }

    .more-link { font-size: 10px; color: var(--text-muted); padding: 1px 4px; }

    /* ── Day panel ── */
    .day-panel {
      border-top: 1px solid var(--border);
      padding: 12px 20px;
      background: #0d1117;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }
    .day-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 10px;
    }
    .day-panel-title {
      font-size: 11px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.7px;
    }
    .panel-add-btn {
      font-size: 11px; color: var(--sky); font-weight: 600;
      background: none; padding: 0;
    }

    .reminder-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 8px;
      background: var(--card); border: 1px solid var(--border);
      margin-bottom: 5px;
    }
    .r-time { font-size: 11px; color: var(--text-muted); width: 48px; flex-shrink: 0; font-weight: 600; }
    .r-title { font-size: 13px; color: var(--text); font-weight: 500; flex: 1; cursor: pointer; }
    .r-title:hover { color: var(--sky); }
    .r-badge {
      font-size: 10px; padding: 2px 7px; border-radius: 20px; font-weight: 700; flex-shrink: 0;
    }
    .badge-daily   { background: rgba(52,211,153,0.15); color: var(--green); }
    .badge-weekly  { background: rgba(56,189,248,0.15); color: var(--sky); }
    .badge-monthly { background: rgba(167,139,250,0.15); color: var(--violet); }
    .badge-none    { background: rgba(122,154,184,0.1); color: var(--text-sec); }
    .r-delete {
      background: none; color: var(--text-muted); font-size: 14px; padding: 2px 4px;
      line-height: 1; flex-shrink: 0;
    }
    .r-delete:hover { color: var(--rose); opacity: 1; }

    .empty-day { color: var(--text-muted); font-size: 12px; padding: 8px 0; }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(8,15,24,0.8);
      display: flex; align-items: center; justify-content: center;
      z-index: 100;
    }
    .modal-overlay.hidden { display: none; }
    .modal {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      width: 400px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.6);
    }
    .modal h2 { font-size: 15px; margin-bottom: 18px; }

    .field { margin-bottom: 14px; }
    .field label {
      display: block; font-size: 11px; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase;
      letter-spacing: 0.6px; margin-bottom: 5px;
    }
    .field input, .field textarea, .field select {
      width: 100%; padding: 8px 10px;
      background: var(--card); border: 1px solid var(--border);
      border-radius: 7px; color: var(--text); font-size: 13px;
      font-family: inherit;
    }
    .field input:focus, .field textarea:focus, .field select:focus {
      outline: 1px solid var(--sky);
    }
    .field textarea { resize: vertical; min-height: 60px; }

    .field-row { display: flex; gap: 10px; }
    .field-row .field { flex: 1; }

    /* Color swatches */
    .swatches { display: flex; gap: 8px; }
    .swatch {
      width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
      border: 2px solid transparent; transition: border-color 0.15s;
    }
    .swatch.selected { border-color: var(--text); }
    .swatch-sky    { background: var(--sky); }
    .swatch-green  { background: var(--green); }
    .swatch-amber  { background: var(--amber); }
    .swatch-orange { background: var(--orange); }
    .swatch-rose   { background: var(--rose); }
    .swatch-violet { background: var(--violet); }

    .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
    .btn-cancel {
      padding: 7px 16px; border-radius: 7px;
      border: 1px solid var(--border) !important;
      background: var(--card); color: var(--text-sec);
      font-size: 13px;
    }
    .btn-save {
      padding: 7px 16px; border-radius: 7px;
      background: var(--sky); color: var(--surface);
      font-size: 13px; font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="header">
      <div class="header-left">
        <button class="nav-btn" id="prev-month">‹</button>
        <div class="month-title" id="month-title">May 2026</div>
        <button class="nav-btn" id="next-month">›</button>
        <button class="today-btn" id="go-today">Today</button>
      </div>
      <button class="add-btn" id="new-reminder">＋ New Reminder</button>
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
        <button class="panel-add-btn" id="panel-add">＋ Add reminder</button>
      </div>
      <div id="day-panel-list"></div>
    </div>
  </div>

  <div class="modal-overlay hidden" id="modal-overlay">
    <div class="modal">
      <h2 id="modal-title">New Reminder</h2>
      <div class="field">
        <label>Title</label>
        <input type="text" id="f-title" placeholder="Reminder title" />
      </div>
      <div class="field">
        <label>Notes</label>
        <textarea id="f-notes" placeholder="Optional notes"></textarea>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Date</label>
          <input type="date" id="f-date" />
        </div>
        <div class="field">
          <label>Time</label>
          <select id="f-time"></select>
        </div>
      </div>
      <div class="field">
        <label>Recurrence</label>
        <select id="f-recurrence">
          <option value="none">Once</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div class="field">
        <label>Color</label>
        <div class="swatches" id="swatches">
          <div class="swatch swatch-sky selected"    data-color="sky"></div>
          <div class="swatch swatch-green"   data-color="green"></div>
          <div class="swatch swatch-amber"   data-color="amber"></div>
          <div class="swatch swatch-orange"  data-color="orange"></div>
          <div class="swatch swatch-rose"    data-color="rose"></div>
          <div class="swatch swatch-violet"  data-color="violet"></div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" id="modal-cancel">Cancel</button>
        <button class="btn-save" id="modal-save">Save</button>
      </div>
    </div>
  </div>

  <script type="module">
    /* script content added in Task 3+ */
  </script>
</body>
</html>
```

- [ ] **Step 2: Visually verify in browser**

Open `apps/reminder/index.html` directly in a browser (not via Vessel yet — just for layout check).
Expected: Dark navy layout with header, empty calendar grid area, day panel, no errors in console.

- [ ] **Step 3: Commit**

```bash
git add apps/reminder/index.html
git commit -m "feat: add HTML skeleton and CSS theme"
```

---

## Task 3: Utility Functions + Storage Helpers

**Files:**
- Modify: `apps/reminder/index.html` — replace the `/* script content */` placeholder with the full script

- [ ] **Step 1: Write the script module — SDK init, storage helpers, and utility functions**

Replace the empty `<script type="module">` block with:

```js
import { ready, storage, notifications } from '../../sdk/index.js'
await ready()

// ── Storage ──────────────────────────────────────────────────────────────────
async function loadReminders() {
  return (await storage.get('reminders')) ?? []
}
async function saveReminders(list) {
  await storage.set('reminders', list)
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function uuid() {
  return crypto.randomUUID?.() ??
    ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16))
}

// Returns 'YYYY-MM-DD' for a Date object (local time)
function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// Floors now to nearest 5-min boundary → 'HH:MM'
function currentSlot() {
  const now = new Date()
  const m = Math.floor(now.getMinutes() / 5) * 5
  return `${String(now.getHours()).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

// Returns true if reminder is due on the given ISO date string
function isDueOn(r, isoDate) {
  if (r.date > isoDate) return false
  if (r.recurrence === 'none')    return r.date === isoDate
  if (r.recurrence === 'daily')   return true
  if (r.recurrence === 'weekly') {
    const base = new Date(r.date + 'T00:00:00')
    const target = new Date(isoDate + 'T00:00:00')
    return base.getDay() === target.getDay()
  }
  if (r.recurrence === 'monthly') {
    return r.date.slice(8) === isoDate.slice(8)   // same day-of-month
  }
  return false
}

// Populate 5-min time options in the <select>
function populateTimeSelect() {
  const sel = document.getElementById('f-time')
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const v = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
      const opt = document.createElement('option')
      opt.value = v
      opt.textContent = v
      sel.appendChild(opt)
    }
  }
}
populateTimeSelect()
```

- [ ] **Step 2: Open in browser, confirm no script errors**

Open `apps/reminder/index.html` in a browser (file:// won't have SDK — but the `await ready()` will hang silently; that's expected. No red errors for the utility functions themselves).

Actually, to fully test the utility functions without Vessel, paste this in the browser console:

```js
// paste isDueOn and toISODate verbatim, then:
console.assert(isDueOn({date:'2026-05-01',recurrence:'daily'}, '2026-05-22') === true)
console.assert(isDueOn({date:'2026-05-22',recurrence:'none'}, '2026-05-22') === true)
console.assert(isDueOn({date:'2026-05-22',recurrence:'none'}, '2026-05-23') === false)
console.assert(isDueOn({date:'2026-05-04',recurrence:'weekly'}, '2026-05-11') === true)  // both Monday
console.assert(isDueOn({date:'2026-05-04',recurrence:'weekly'}, '2026-05-12') === false) // Tuesday
console.assert(isDueOn({date:'2026-05-05',recurrence:'monthly'}, '2026-06-05') === true)
console.assert(isDueOn({date:'2026-05-05',recurrence:'monthly'}, '2026-06-06') === false)
console.log('all isDueOn assertions passed')
```

Expected: `all isDueOn assertions passed` with no assertion failures.

- [ ] **Step 3: Commit**

```bash
git add apps/reminder/index.html
git commit -m "feat: add SDK init, storage helpers, and utility functions"
```

---

## Task 4: Calendar Grid Renderer

**Files:**
- Modify: `apps/reminder/index.html` — append to the script module

- [ ] **Step 1: Add state variables and `renderCalendar()` function**

Append to the script module (after `populateTimeSelect()`):

```js
// ── State ─────────────────────────────────────────────────────────────────────
let reminders = []
const today = toISODate(new Date())
let viewYear = new Date().getFullYear()
let viewMonth = new Date().getMonth()   // 0-indexed
let selectedDate = today
let editingId = null

// ── Calendar renderer ─────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

function renderCalendar() {
  document.getElementById('month-title').textContent =
    `${MONTHS[viewMonth]} ${viewYear}`

  const grid = document.getElementById('calendar-grid')
  grid.innerHTML = ''

  // First day of the month (0=Sun)
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  // Days in this month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  // Days in previous month
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate()

  const cells = []

  // Leading cells from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, daysInPrev - i)
    cells.push({ date: toISODate(d), otherMonth: true })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: toISODate(new Date(viewYear, viewMonth, d)), otherMonth: false })
  }
  // Trailing cells to fill 6 rows (42 cells)
  let trailing = 1
  while (cells.length < 42) {
    const d = new Date(viewYear, viewMonth + 1, trailing++)
    cells.push({ date: toISODate(d), otherMonth: true })
  }

  for (const { date, otherMonth } of cells) {
    const cell = document.createElement('div')
    cell.className = 'cell' +
      (otherMonth ? ' other-month' : '') +
      (date === today ? ' today' : '') +
      (date === selectedDate ? ' selected' : '')
    cell.dataset.date = date

    const dayNum = document.createElement('div')
    dayNum.className = 'date-num'
    dayNum.textContent = Number(date.slice(8))
    cell.appendChild(dayNum)

    // Pills for reminders due on this date
    const due = reminders.filter(r => isDueOn(r, date))
    const visible = due.slice(0, 2)
    for (const r of visible) {
      const pill = document.createElement('div')
      pill.className = `pill pill-${r.color}`
      pill.innerHTML = `<div class="pill-dot"></div>${r.title}`
      cell.appendChild(pill)
    }
    if (due.length > 2) {
      const more = document.createElement('div')
      more.className = 'more-link'
      more.textContent = `+${due.length - 2} more`
      cell.appendChild(more)
    }

    grid.appendChild(cell)
  }
}
```

- [ ] **Step 2: Call `renderCalendar()` at bottom of script to verify it renders**

Append at the bottom of the script:
```js
renderCalendar()
```

- [ ] **Step 3: Open in Vessel and verify**

Install the current build in Vessel (`npm run build`, install zip). Expected: month grid renders with correct day numbers, today cell highlighted.

- [ ] **Step 4: Commit**

```bash
git add apps/reminder/index.html
git commit -m "feat: render calendar month grid"
```

---

## Task 5: Day Panel Renderer

**Files:**
- Modify: `apps/reminder/index.html` — append to the script module

- [ ] **Step 1: Add `renderDayPanel()` function**

Append to the script module (before the `renderCalendar()` call):

```js
// ── Day panel renderer ────────────────────────────────────────────────────────
const BADGE = { daily: 'badge-daily', weekly: 'badge-weekly', monthly: 'badge-monthly', none: 'badge-none' }
const BADGE_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', none: 'Once' }

function renderDayPanel() {
  const title = document.getElementById('day-panel-title')
  const list = document.getElementById('day-panel-list')

  const d = new Date(selectedDate + 'T00:00:00')
  const isToday = selectedDate === today
  title.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) +
    (isToday ? ' — Today' : '')

  const due = reminders
    .filter(r => isDueOn(r, selectedDate))
    .sort((a, b) => a.time.localeCompare(b.time))

  list.innerHTML = ''
  if (!due.length) {
    list.innerHTML = '<div class="empty-day">No reminders for this day.</div>'
    return
  }

  for (const r of due) {
    const row = document.createElement('div')
    row.className = 'reminder-row'
    row.innerHTML = `
      <div class="r-time">${r.time}</div>
      <div class="r-title" data-edit="${r.id}">${r.title}</div>
      <div class="r-badge ${BADGE[r.recurrence]}">${BADGE_LABEL[r.recurrence]}</div>
      <button class="r-delete" data-delete="${r.id}" title="Delete">✕</button>
    `
    list.appendChild(row)
  }
}
```

- [ ] **Step 2: Update the bottom of script to call both renderers**

Replace the existing `renderCalendar()` call at the bottom with:
```js
renderCalendar()
renderDayPanel()
```

- [ ] **Step 3: Verify in Vessel**

Build and install. Expected: day panel shows "No reminders for this day." under today's date label. No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/reminder/index.html
git commit -m "feat: render day detail panel"
```

---

## Task 6: Add / Edit Modal

**Files:**
- Modify: `apps/reminder/index.html` — append to the script module

- [ ] **Step 1: Add modal open/close functions**

Append to the script module (before the bottom render calls):

```js
// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(prefillDate = selectedDate, reminder = null) {
  editingId = reminder?.id ?? null
  document.getElementById('modal-title').textContent = reminder ? 'Edit Reminder' : 'New Reminder'
  document.getElementById('f-title').value = reminder?.title ?? ''
  document.getElementById('f-notes').value = reminder?.notes ?? ''
  document.getElementById('f-date').value = reminder?.date ?? prefillDate
  document.getElementById('f-time').value = reminder?.time ?? '09:00'
  document.getElementById('f-recurrence').value = reminder?.recurrence ?? 'none'

  const color = reminder?.color ?? 'sky'
  document.querySelectorAll('.swatch').forEach(s => {
    s.classList.toggle('selected', s.dataset.color === color)
  })

  document.getElementById('modal-overlay').classList.remove('hidden')
  document.getElementById('f-title').focus()
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden')
  editingId = null
}

async function saveModal() {
  const title = document.getElementById('f-title').value.trim()
  if (!title) { document.getElementById('f-title').focus(); return }

  const selectedSwatch = document.querySelector('.swatch.selected')
  const r = {
    id: editingId ?? uuid(),
    title,
    notes: document.getElementById('f-notes').value.trim(),
    date: document.getElementById('f-date').value,
    time: document.getElementById('f-time').value,
    recurrence: document.getElementById('f-recurrence').value,
    color: selectedSwatch?.dataset.color ?? 'sky',
    notifiedDates: [],
  }

  if (editingId) {
    // Preserve notifiedDates when editing
    const existing = reminders.find(x => x.id === editingId)
    if (existing) r.notifiedDates = existing.notifiedDates
    reminders = reminders.map(x => x.id === editingId ? r : x)
  } else {
    reminders.push(r)
  }

  await saveReminders(reminders)
  closeModal()
  renderCalendar()
  renderDayPanel()
}
```

- [ ] **Step 2: Verify modal HTML exists**

The modal HTML was added in Task 2's skeleton. Confirm `id="modal-overlay"` exists in the HTML.

- [ ] **Step 3: Commit**

```bash
git add apps/reminder/index.html
git commit -m "feat: add modal open/close/save logic"
```

---

## Task 7: Event Wiring

**Files:**
- Modify: `apps/reminder/index.html` — append to the script module

- [ ] **Step 1: Add all event listeners**

Append to the script module (before the bottom render calls):

```js
// ── Event handlers ────────────────────────────────────────────────────────────

// Calendar day click
document.getElementById('calendar-grid').addEventListener('click', e => {
  const cell = e.target.closest('.cell')
  if (!cell) return
  selectedDate = cell.dataset.date
  renderCalendar()
  renderDayPanel()
})

// Month navigation
document.getElementById('prev-month').addEventListener('click', () => {
  viewMonth--
  if (viewMonth < 0) { viewMonth = 11; viewYear-- }
  renderCalendar()
})
document.getElementById('next-month').addEventListener('click', () => {
  viewMonth++
  if (viewMonth > 11) { viewMonth = 0; viewYear++ }
  renderCalendar()
})
document.getElementById('go-today').addEventListener('click', () => {
  viewYear = new Date().getFullYear()
  viewMonth = new Date().getMonth()
  selectedDate = today
  renderCalendar()
  renderDayPanel()
})

// New reminder buttons
document.getElementById('new-reminder').addEventListener('click', () => openModal())
document.getElementById('panel-add').addEventListener('click', () => openModal(selectedDate))

// Day panel — edit / delete via event delegation
document.getElementById('day-panel-list').addEventListener('click', async e => {
  const editId = e.target.dataset.edit
  const deleteId = e.target.dataset.delete

  if (editId) {
    const r = reminders.find(x => x.id === editId)
    if (r) openModal(selectedDate, r)
  }
  if (deleteId) {
    reminders = reminders.filter(x => x.id !== deleteId)
    await saveReminders(reminders)
    renderCalendar()
    renderDayPanel()
  }
})

// Modal buttons
document.getElementById('modal-save').addEventListener('click', saveModal)
document.getElementById('modal-cancel').addEventListener('click', closeModal)
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal()
})

// Color swatch selection
document.getElementById('swatches').addEventListener('click', e => {
  const swatch = e.target.closest('.swatch')
  if (!swatch) return
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'))
  swatch.classList.add('selected')
})
```

- [ ] **Step 2: Build and install in Vessel**

```bash
npm run build
```

Install `dist/vessel-reminder.zip` in Vessel.

- [ ] **Step 3: Manual smoke test**

- Click different days → day panel updates  
- Click "＋ New Reminder" → modal opens  
- Fill fields, choose color, save → reminder appears in calendar grid and day panel  
- Click a reminder title in the panel → edit modal opens pre-filled  
- Edit and save → reminder updates  
- Click ✕ on a reminder → it's deleted  
- Navigate months with ‹ › → today button returns to current month  

- [ ] **Step 4: Commit**

```bash
git add apps/reminder/index.html
git commit -m "feat: wire all UI event handlers"
```

---

## Task 8: Notification Poller

**Files:**
- Modify: `apps/reminder/index.html` — append to the script module

- [ ] **Step 1: Add `startPoller()` function**

Append to the script module (before the bottom init block):

```js
// ── Notification poller ───────────────────────────────────────────────────────
async function pollNotifications() {
  const now = toISODate(new Date())
  const slot = currentSlot()
  const list = await loadReminders()
  let changed = false

  for (const r of list) {
    if (!isDueOn(r, now)) continue
    if (r.time !== slot) continue
    if (r.notifiedDates.includes(now)) continue

    await notifications.send({ title: r.title, body: r.time })
    r.notifiedDates.push(now)
    changed = true
  }

  if (changed) {
    await saveReminders(list)
    reminders = list
  }
}

function startPoller() {
  pollNotifications()  // run immediately on start
  setInterval(pollNotifications, 5 * 60 * 1000)
}
```

- [ ] **Step 2: Update the init block at the bottom of the script**

Replace the two render calls at the bottom with a proper init block:

```js
// ── Init ──────────────────────────────────────────────────────────────────────
reminders = await loadReminders()
renderCalendar()
renderDayPanel()
startPoller()
```

- [ ] **Step 3: Test notification (manual)**

To verify without waiting 5 minutes: temporarily change `5 * 60 * 1000` to `5000` and create a reminder for the current 5-minute slot. Build, install, wait 5 seconds — notification should fire. Revert the interval before final commit.

- [ ] **Step 4: Final build and install**

```bash
npm run build
```

Install `dist/vessel-reminder.zip` in Vessel. Verify full app works end-to-end.

- [ ] **Step 5: Commit**

```bash
git add apps/reminder/index.html
git commit -m "feat: add notification polling every 5 minutes"
```

---

## Task 9: Final Polish + Zip

**Files:**
- Modify: `apps/reminder/index.html` — minor UX touches
- Create: `.gitignore`

- [ ] **Step 1: Add `.gitignore`**

```
node_modules/
dist/
sdk/
.superpowers/
```

- [ ] **Step 2: Edge case — keyboard shortcut to close modal**

Add to event handlers section:
```js
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal()
})
```

- [ ] **Step 3: Edge case — require date field to be non-empty before save**

In `saveModal()`, after the title check, add:
```js
const date = document.getElementById('f-date').value
if (!date) { document.getElementById('f-date').focus(); return }
```

- [ ] **Step 4: Final build**

```bash
npm run build
```

Verify `dist/vessel-reminder.zip` installs cleanly and all features work.

- [ ] **Step 5: Commit**

```bash
git add .gitignore apps/reminder/index.html
git commit -m "feat: polish — ESC to close modal, date validation, gitignore"
```
