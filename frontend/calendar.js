import {
  fetchSignupsForRange,
  addSignup as apiAddSignup,
  removeSignup as apiRemoveSignup,
} from './api.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── State ────────────────────────────────────────────────────────────────────

let signups       = {}; // { 'YYYY-MM-DD': ['Name', ...] }
let currentSeason = null;
let weekends      = [];

// ─── Season Logic ─────────────────────────────────────────────────────────────

function makeSeason(year, type) {
  if (type === 'spring') {
    return { label: `Spring ${year}`, start: new Date(year, 1, 15), end: new Date(year, 3, 30) };
  }
  return { label: `Fall ${year}`, start: new Date(year, 9, 1), end: new Date(year, 11, 15) };
}

function getActiveSeason() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();

  const candidates = [
    makeSeason(y - 1, 'fall'),
    makeSeason(y, 'spring'),
    makeSeason(y, 'fall'),
    makeSeason(y + 1, 'spring'),
  ];

  // Return current season if we're inside one
  for (const s of candidates) {
    if (today >= s.start && today <= s.end) return s;
  }

  // Otherwise return the next upcoming season
  for (const s of candidates) {
    if (s.start > today) return s;
  }

  return makeSeason(y + 1, 'spring');
}

function buildWeekendPairs(season) {
  // Collect all Saturdays and Sundays within the season
  const days = [];
  const cur  = new Date(season.start);
  while (cur <= season.end) {
    const dow = cur.getDay();
    if (dow === 0 || dow === 6) days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  // Group consecutive Sat+Sun into pairs
  const pairs = [];
  let i = 0;
  while (i < days.length) {
    const day = days[i];
    if (day.getDay() === 6) { // Saturday
      const next = days[i + 1];
      if (next && next.getDay() === 0) {
        pairs.push({ sat: day, sun: next });
        i += 2;
      } else {
        pairs.push({ sat: day, sun: null });
        i += 1;
      }
    } else { // Lone Sunday (season opened on a Sunday)
      pairs.push({ sat: null, sun: day });
      i += 1;
    }
  }
  return pairs;
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isPast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function formatLong(date) {
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function render() {
  const container  = document.getElementById('calendar');
  container.innerHTML = '';
  let currentMonth = -1;

  for (const pair of weekends) {
    const ref   = pair.sat || pair.sun;
    const month = ref.getMonth();

    // Month header
    if (month !== currentMonth) {
      currentMonth = month;
      const hdr = document.createElement('div');
      hdr.className   = 'month-header';
      hdr.textContent = `${MONTH_NAMES[month]} ${ref.getFullYear()}`;
      container.appendChild(hdr);
    }

    // Weekend pair wrapper
    const pairEl = document.createElement('div');
    pairEl.className = 'weekend-pair';
    if (pair.sat) pairEl.appendChild(buildTile(pair.sat));
    if (pair.sun) pairEl.appendChild(buildTile(pair.sun));
    container.appendChild(pairEl);
  }
}

function buildTile(date) {
  const iso   = toISO(date);
  const past  = isPast(date);
  const names = signups[iso] || [];

  const tile = document.createElement('div');
  tile.className    = `day-tile${past ? ' past' : ''}`;
  tile.dataset.date = iso;

  // Header
  const header   = document.createElement('div');
  header.className = 'tile-header';

  const daySpan  = document.createElement('span');
  daySpan.className   = 'tile-day-name';
  daySpan.textContent = DAY_NAMES[date.getDay()];

  const dateSpan  = document.createElement('span');
  dateSpan.className   = 'tile-date-num';
  dateSpan.textContent = `${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getDate()}`;

  header.appendChild(daySpan);
  header.appendChild(dateSpan);
  tile.appendChild(header);

  // Name list
  const list = document.createElement('div');
  list.className = 'name-list';

  if (names.length === 0) {
    const empty = document.createElement('p');
    empty.className   = 'empty-msg';
    empty.textContent = past ? 'No one signed up.' : 'No one yet — be the first!';
    list.appendChild(empty);
  } else {
    for (const name of names) {
      const tag = document.createElement('span');
      tag.className   = `name-tag${past ? ' past' : ''}`;
      tag.textContent = name;
      if (!past) tag.addEventListener('click', () => openRemoveModal(iso, name));
      list.appendChild(tag);
    }
  }
  tile.appendChild(list);

  // Sign-up button (future dates only)
  if (!past) {
    const btn = document.createElement('button');
    btn.className   = 'signup-btn';
    btn.textContent = '+ Sign Up';
    btn.addEventListener('click', () => openSignupModal(iso, date));
    tile.appendChild(btn);
  }

  return tile;
}

// ─── Sign-Up Modal ────────────────────────────────────────────────────────────

function openSignupModal(iso, date) {
  const modal = document.getElementById('signup-modal');
  document.getElementById('modal-title').textContent = `Sign up for ${formatLong(date)}`;
  document.getElementById('name-input').value        = '';
  document.getElementById('modal-error').textContent = '';
  modal.dataset.date = iso;
  modal.classList.add('open');
  document.getElementById('name-input').focus();
}

function closeSignupModal() {
  document.getElementById('signup-modal').classList.remove('open');
}

async function submitSignup() {
  const modal = document.getElementById('signup-modal');
  const input = document.getElementById('name-input');
  const error = document.getElementById('modal-error');
  const iso   = modal.dataset.date;
  const name  = input.value.trim();

  if (!name) {
    error.textContent = 'Please enter your name.';
    return;
  }

  // Local duplicate check
  const existing = (signups[iso] || []).map(n => n.toLowerCase());
  if (existing.includes(name.toLowerCase())) {
    error.textContent = `${name} is already signed up for this day.`;
    return;
  }

  // Optimistic update
  if (!signups[iso]) signups[iso] = [];
  signups[iso].push(name);
  closeSignupModal();
  render();

  try {
    await apiAddSignup(iso, name);
  } catch (err) {
    // Rollback
    signups[iso] = signups[iso].filter(n => n !== name);
    render();
    showToast(err.message || 'Could not save. Please try again.', 'error');
  }
}

// ─── Remove Modal ─────────────────────────────────────────────────────────────

function openRemoveModal(iso, name) {
  const modal = document.getElementById('remove-modal');
  const date  = fromISO(iso);
  document.getElementById('remove-msg').innerHTML =
    `Remove <strong>${name}</strong> from <strong>${formatLong(date)}</strong>?`;
  modal.dataset.date = iso;
  modal.dataset.name = name;
  modal.classList.add('open');
}

function closeRemoveModal() {
  document.getElementById('remove-modal').classList.remove('open');
}

async function confirmRemove() {
  const modal = document.getElementById('remove-modal');
  const iso   = modal.dataset.date;
  const name  = modal.dataset.name;

  // Optimistic update
  signups[iso] = (signups[iso] || []).filter(n => n !== name);
  closeRemoveModal();
  render();

  try {
    await apiRemoveSignup(iso, name);
  } catch (err) {
    // Rollback
    if (!signups[iso]) signups[iso] = [];
    signups[iso].push(name);
    render();
    showToast('Could not remove. Please try again.', 'error');
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── Data Loading ─────────────────────────────────────────────────────────────

async function loadSignups() {
  const start = toISO(currentSeason.start);
  const end   = toISO(currentSeason.end);
  try {
    signups = await fetchSignupsForRange(start, end);
    render();
  } catch (err) {
    showToast('Could not load signups. Check your connection.', 'error');
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  currentSeason = getActiveSeason();
  weekends      = buildWeekendPairs(currentSeason);

  document.getElementById('season-info').textContent =
    `${currentSeason.label} Fire Season`;

  render();
  loadSignups();

  // Sign-up modal wiring
  document.getElementById('modal-confirm').addEventListener('click', submitSignup);
  document.getElementById('modal-cancel').addEventListener('click', closeSignupModal);
  document.getElementById('name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitSignup();
  });
  document.getElementById('signup-modal').addEventListener('click', e => {
    if (e.target.id === 'signup-modal') closeSignupModal();
  });

  // Remove modal wiring
  document.getElementById('remove-confirm').addEventListener('click', confirmRemove);
  document.getElementById('remove-cancel').addEventListener('click', closeRemoveModal);
  document.getElementById('remove-modal').addEventListener('click', e => {
    if (e.target.id === 'remove-modal') closeRemoveModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
