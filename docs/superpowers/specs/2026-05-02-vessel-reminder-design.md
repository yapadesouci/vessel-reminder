# Vessel Reminder — Design Spec

**Date:** 2026-05-02  
**Status:** Approved

---

## Overview

A Vessel cargo that lets users create, manage, and get notified about reminders. The app runs as a sandboxed static web app inside the Vessel Electron host. Vessel is assumed to always be running; the reminder app polls in the background to fire system notifications even when another Vessel app is in focus.

---

## Architecture

- **Type:** Single Vessel cargo, single app (`reminder`)
- **Tech:** Vanilla HTML + CSS + ES module JavaScript — no framework, no build pipeline beyond the template's `pack.js` zip script
- **SDK dependency:** `@vessel-aircodr/sdk` (copied to `sdk/index.js` by pack script)
- **Permissions:** `storage`, `notifications`

---

## Data Model

All state is persisted in Vessel storage under a single key `"reminders"`. Value is a JSON array of reminder objects.

```json
[
  {
    "id": "uuid-v4",
    "title": "Team standup",
    "notes": "Optional free-text notes",
    "date": "2026-05-22",
    "time": "09:00",
    "recurrence": "daily",
    "color": "green",
    "notifiedDates": ["2026-05-22"]
  }
]
```

### Field rules

| Field | Type | Values |
|-------|------|--------|
| `id` | string | UUID v4, generated at creation |
| `title` | string | Required, non-empty |
| `notes` | string | Optional, may be empty |
| `date` | string | ISO date `YYYY-MM-DD` — base date for one-time; anchor for recurring |
| `time` | string | `HH:MM`, minutes restricted to multiples of 5 |
| `recurrence` | string | `"none"` \| `"daily"` \| `"weekly"` \| `"monthly"` |
| `color` | string | `"sky"` \| `"green"` \| `"amber"` \| `"orange"` \| `"rose"` \| `"violet"` |
| `notifiedDates` | string[] | ISO dates on which notification was already fired — prevents double-notifying |

### Recurrence logic

At poll time, a reminder is considered **due today** if:
- `recurrence === "none"` and `date === today`
- `recurrence === "daily"` and `date <= today`
- `recurrence === "weekly"` and `date <= today` and `dayOfWeek(date) === dayOfWeek(today)`
- `recurrence === "monthly"` and `date <= today` and `dayOfMonth(date) === dayOfMonth(today)`

---

## UI

### Views

1. **Calendar view** (default)
   - Full month grid (Sun–Sat columns)
   - Each cell shows the day number + up to 2 reminder pills (colored, truncated title)
   - Overflow shown as "+N more"
   - Today highlighted with sky-blue date circle
   - Clicking a day selects it and updates the day detail panel

2. **Day detail panel** (below the calendar grid)
   - Shows all reminders whose recurrence pattern lands on the selected day (same logic as the notification poller — not just reminders whose base `date` equals that day), sorted by time
   - Each row: time | title | recurrence badge (Daily / Weekly / Monthly / Once)
   - "＋ Add reminder" shortcut pre-fills the selected date
   - Trash icon on each row to delete

3. **Add / Edit modal** (overlay)
   - Triggered by "＋ New Reminder" header button or clicking a reminder row
   - Fields: Title (text), Notes (textarea), Date (date picker), Time (select, 5-min increments), Color (6-swatch picker), Recurrence (dropdown)
   - Save → write to storage → close modal → refresh calendar
   - Cancel → close without saving

### Theme

Vessel dark navy color system extracted from the host app:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#080f18` | App body |
| Surface | `#0d1620` | App card |
| Panel | `#0f1e2e` | Header |
| Card | `#132233` | Reminder rows, cell hover |
| Border | `#1e3048` | Dividers, row borders |
| Text primary | `#e8eef5` | Titles |
| Text secondary | `#7a9ab8` | Times, labels |
| Text muted | `#3a5570` | Day headers, placeholders |
| Accent sky | `#38bdf8` | Today highlight, CTA button, sky pills |
| Accent green | `#34d399` | Green pills |
| Accent amber | `#fbbf24` | Amber pills |
| Accent orange | `#fb923c` | Orange pills |
| Accent rose | `#f87171` | Rose pills |
| Accent violet | `#a78bfa` | Violet pills |

---

## Notification Polling

- `setInterval` fires every **5 minutes** (`300_000 ms`) after `await ready()`
- On each tick:
  1. Compute current date (`YYYY-MM-DD`) and current 5-minute slot by flooring `now` to the nearest 5 minutes and formatting as `HH:MM` (e.g. a poll at 09:03 → slot `"09:00"`)
  2. Load reminders from storage
  3. Filter reminders that are due today (per recurrence logic) AND whose `time` string equals the current slot string AND whose `notifiedDates` does not include today
  4. For each match: call `notifications.send({ title: reminder.title, body: reminder.time })`, add today to `notifiedDates`, save updated reminders back to storage

---

## File Structure

```
vessel-reminder/
  manifest.json
  package.json
  sdk/
    index.js              ← copied from node_modules by pack.js
  apps/
    reminder/
      index.html          ← entire app (HTML + inline CSS + inline JS module)
  scripts/
    pack.js               ← zips manifest.json + sdk/ + apps/ → dist/vessel-reminder.zip
```

---

## manifest.json

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

---

## Out of Scope (v1)

- Snooze / dismiss actions on notifications
- Multiple notification sounds or custom sounds
- Drag-and-drop rescheduling
- Import/export
- Search
