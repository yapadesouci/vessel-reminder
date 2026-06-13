// Reminder — a Vessel cargo.
// A month calendar with per-day reminders, persisted via vessel.storage and
// surfaced through vessel.notifications when they come due (while open).

const COLORS = ['accent', 'success', 'warning', 'danger', 'info']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const $ = (id) => document.getElementById(id)

// ── State ─────────────────────────────────────────────────
let reminders = []          // { id, date:'YYYY-MM-DD', time:'HH:MM', title, color }
let view = null             // { year, month }  (month: 0-11)
let selected = null         // 'YYYY-MM-DD'
let editingId = null
let formColor = 'accent'
const _timers = new Map()

// ── Date helpers ──────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const todayIso = () => {
  const d = new Date()
  return iso(d.getFullYear(), d.getMonth(), d.getDate())
}
function parseIso(s) {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m: m - 1, d }
}
function formatLong(isoStr) {
  const { y, m, d } = parseIso(isoStr)
  const date = new Date(y, m, d)
  const dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]
  const suffix = isoStr === todayIso() ? ' · Today' : ''
  return `${dow}, ${d} ${MONTHS[m].slice(0, 3)}${suffix}`
}

// ── Persistence ───────────────────────────────────────────
async function load() {
  const stored = await vessel.storage.get('reminders')
  reminders = Array.isArray(stored) ? stored : []
}
async function persist() {
  await vessel.storage.set('reminders', reminders)
  scheduleNotifications()
}

function remindersOn(dateIso) {
  return reminders
    .filter((r) => r.date === dateIso)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
}

// ── Render: calendar ──────────────────────────────────────
function render() {
  $('month-label').textContent = `${MONTHS[view.month]} ${view.year}`
  renderGrid()
  renderPanel()
}

function renderGrid() {
  const grid = $('cal-grid')
  grid.innerHTML = ''
  const first = new Date(view.year, view.month, 1)
  const startDow = first.getDay()
  const start = new Date(view.year, view.month, 1 - startDow)
  const today = todayIso()

  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dateIso = iso(d.getFullYear(), d.getMonth(), d.getDate())
    const other = d.getMonth() !== view.month

    const cell = document.createElement('div')
    cell.className = 'rm-cell' + (other ? ' other' : '') +
      (dateIso === today ? ' today' : '') + (dateIso === selected ? ' sel' : '')
    cell.dataset.date = dateIso
    cell.addEventListener('click', () => {
      selected = dateIso
      render()
    })

    const num = document.createElement('div')
    num.className = 'rm-num'
    num.textContent = d.getDate()
    cell.appendChild(num)

    const dayReminders = remindersOn(dateIso)
    dayReminders.slice(0, 2).forEach((r) => {
      const pill = document.createElement('div')
      pill.className = `rm-pill ${r.color || 'accent'}`
      pill.textContent = r.title || 'Untitled'
      cell.appendChild(pill)
    })
    if (dayReminders.length > 2) {
      const more = document.createElement('div')
      more.className = 'rm-more'
      more.textContent = `+${dayReminders.length - 2} more`
      cell.appendChild(more)
    }
    grid.appendChild(cell)
  }
}

// ── Render: day panel ─────────────────────────────────────
function renderPanel() {
  const panel = $('panel')
  panel.innerHTML = ''

  const title = document.createElement('div')
  title.className = 'rm-panel-title'
  title.textContent = formatLong(selected)
  panel.appendChild(title)

  const list = remindersOn(selected)
  if (!list.length) {
    const empty = document.createElement('div')
    empty.className = 'rm-empty'
    empty.textContent = 'No reminders. Add one with “New reminder”.'
    panel.appendChild(empty)
    return
  }

  for (const r of list) {
    const row = document.createElement('div')
    row.className = 'rm-row'

    const time = document.createElement('span')
    time.className = 'rm-time'
    time.textContent = r.time || '—'

    const dot = document.createElement('span')
    dot.className = 'rm-cdot'
    dot.style.background = `var(--vs-${r.color || 'accent'})`

    const name = document.createElement('span')
    name.className = 'rm-rtitle'
    name.textContent = r.title || 'Untitled'

    const edit = document.createElement('span')
    edit.className = 'dd-icon-btn'
    edit.style.cssText = 'width:24px;height:24px'
    edit.title = 'Edit'
    edit.innerHTML = '<svg class="vi" viewBox="0 0 24 24"><use href="#vi-pencil"/></svg>'
    edit.addEventListener('click', () => openModal(r))

    const del = document.createElement('span')
    del.className = 'dd-icon-btn'
    del.style.cssText = 'width:24px;height:24px'
    del.title = 'Delete'
    del.innerHTML = '<svg class="vi" viewBox="0 0 24 24"><use href="#vi-trash"/></svg>'
    del.addEventListener('click', async () => {
      reminders = reminders.filter((x) => x.id !== r.id)
      await persist()
      render()
    })

    row.append(time, dot, name, edit, del)
    panel.appendChild(row)
  }
}

// ── Modal ─────────────────────────────────────────────────
function openModal(existing) {
  editingId = existing?.id ?? null
  $('rm-modal-title').textContent = existing ? 'Edit reminder' : 'New reminder'
  $('rm-f-save').textContent = existing ? 'Save' : 'Add reminder'
  $('rm-f-title').value = existing?.title ?? ''
  $('rm-f-date').value = existing?.date ?? selected
  $('rm-f-time').value = existing?.time ?? '09:00'
  setFormColor(existing?.color ?? 'accent')
  $('rm-modal').style.display = 'flex'
  setTimeout(() => $('rm-f-title').focus(), 0)
}
function closeModal() {
  $('rm-modal').style.display = 'none'
  editingId = null
}
function setFormColor(color) {
  formColor = COLORS.includes(color) ? color : 'accent'
  document.querySelectorAll('#rm-f-colors .rm-swatch').forEach((b) => {
    b.dataset.on = b.dataset.color === formColor ? '1' : '0'
  })
}
async function saveFromModal() {
  const title = $('rm-f-title').value.trim()
  const date = $('rm-f-date').value || selected
  const time = $('rm-f-time').value || '09:00'
  if (!title) {
    $('rm-f-title').focus()
    return
  }
  if (editingId) {
    reminders = reminders.map((r) =>
      r.id === editingId ? { ...r, title, date, time, color: formColor } : r)
  } else {
    reminders.push({ id: uid(), title, date, time, color: formColor })
  }
  selected = date
  if (date) view = { year: parseIso(date).y, month: parseIso(date).m }
  await persist()
  closeModal()
  render()
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// ── Notifications (fire while the app is open) ────────────
function scheduleNotifications() {
  for (const t of _timers.values()) clearTimeout(t)
  _timers.clear()
  if (!vessel.notifications) return
  const now = Date.now()
  for (const r of reminders) {
    const when = new Date(`${r.date}T${r.time || '09:00'}:00`).getTime()
    const delay = when - now
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) continue // only within 24h
    _timers.set(
      r.id,
      setTimeout(() => {
        vessel.notifications.send({ title: 'Reminder', body: r.title }).catch(() => {})
      }, delay)
    )
  }
}

// ── Wire toolbar + modal ──────────────────────────────────
function shiftMonth(delta) {
  let m = view.month + delta
  let y = view.year
  if (m < 0) { m = 11; y-- }
  if (m > 11) { m = 0; y++ }
  view = { year: y, month: m }
  render()
}

$('btn-prev').addEventListener('click', () => shiftMonth(-1))
$('btn-next').addEventListener('click', () => shiftMonth(1))
$('btn-today').addEventListener('click', () => {
  selected = todayIso()
  const { y, m } = parseIso(selected)
  view = { year: y, month: m }
  render()
})
$('btn-new').addEventListener('click', () => openModal(null))
$('rm-f-cancel').addEventListener('click', closeModal)
$('rm-f-save').addEventListener('click', saveFromModal)
$('rm-modal').addEventListener('click', (e) => {
  if (e.target === $('rm-modal')) closeModal()
})
$('rm-f-colors').addEventListener('click', (e) => {
  const sw = e.target.closest('.rm-swatch')
  if (sw) setFormColor(sw.dataset.color)
})
$('rm-f-title').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveFromModal()
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('rm-modal').style.display !== 'none') closeModal()
})

// ── Boot ──────────────────────────────────────────────────
await vessel.ready()
await load()
selected = todayIso()
const t = parseIso(selected)
view = { year: t.y, month: t.m }
render()
scheduleNotifications()
