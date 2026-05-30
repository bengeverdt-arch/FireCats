const ADMIN_PIN  = '1234';
const WORKER_URL = 'https://firecats-worker.bengeverdt.workers.dev';

const ROSTER = [
  'Ben Geverdt',
  'Placeholder Two',
  'Placeholder Three',
  'Placeholder Four',
  'Placeholder Five',
  'Placeholder Six',
  'Placeholder Seven',
  'Placeholder Eight',
  'Placeholder Nine',
  'Placeholder Ten',
  'Placeholder Eleven',
  'Placeholder Twelve',
  'Placeholder Thirteen',
  'Placeholder Fourteen',
  'Placeholder Fifteen',
  'Placeholder Sixteen',
];

// ─── Season / Date Helpers ────────────────────────────────────────────────────

function getActiveSeason() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();

  const candidates = [
    { label: `Fall ${y - 1}`,   start: new Date(y - 1, 9, 1),  end: new Date(y - 1, 11, 15) },
    { label: `Spring ${y}`,     start: new Date(y, 1, 15),      end: new Date(y, 3, 30) },
    { label: `Fall ${y}`,       start: new Date(y, 9, 1),       end: new Date(y, 11, 15) },
    { label: `Spring ${y + 1}`, start: new Date(y + 1, 1, 15),  end: new Date(y + 1, 3, 30) },
  ];

  for (const s of candidates) {
    if (today >= s.start && today <= s.end) return s;
  }
  for (const s of candidates) {
    if (s.start > today) return s;
  }
  return candidates[candidates.length - 1];
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getThisWeekend() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();

  if (dow === 6) {
    const sun = new Date(today);
    sun.setDate(sun.getDate() + 1);
    return [toISO(today), toISO(sun)];
  }
  if (dow === 0) {
    return [toISO(today)];
  }
  const sat = new Date(today);
  sat.setDate(sat.getDate() + (6 - dow));
  const sun = new Date(sat);
  sun.setDate(sun.getDate() + 1);
  return [toISO(sat), toISO(sun)];
}

// ─── Name Matching ────────────────────────────────────────────────────────────

function norm(name) {
  return name.toLowerCase().trim();
}

function matchToRoster(signupName, roster) {
  const s = norm(signupName);

  // Exact
  for (const r of roster) {
    if (norm(r) === s) return r;
  }

  // First name match — roster first vs signup first
  for (const r of roster) {
    const rFirst = norm(r).split(' ')[0];
    const sFirst = s.split(' ')[0];
    if (rFirst === sFirst) return r;
  }

  // Roster first name contained anywhere in signup (e.g. "ben g" matches "Ben Geverdt")
  for (const r of roster) {
    const rFirst = norm(r).split(' ')[0];
    if (s.includes(rFirst) || rFirst.includes(s)) return r;
  }

  return null;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function buildStats(signupsByDate) {
  const weekend  = getThisWeekend();
  const counts   = Object.fromEntries(ROSTER.map(n => [n, 0]));
  const thisWeek = Object.fromEntries(ROSTER.map(n => [n, false]));
  const unmatched = new Set();

  for (const [date, names] of Object.entries(signupsByDate)) {
    for (const name of names) {
      const matched = matchToRoster(name, ROSTER);
      if (matched) {
        counts[matched]++;
        if (weekend.includes(date)) thisWeek[matched] = true;
      } else {
        unmatched.add(name);
      }
    }
  }

  return { counts, thisWeek, unmatched: [...unmatched] };
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderChart(stats, season) {
  const container = document.getElementById('roster-chart');
  if (!container) return;

  const { counts, thisWeek, unmatched } = stats;
  const maxCount = Math.max(...Object.values(counts), 1);
  const sorted   = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  let html = `<p class="chart-season-label">${season.label} Fire Season</p>`;

  for (const [name, count] of sorted) {
    const pct = Math.round((count / maxCount) * 100);
    html += `
      <div class="roster-row">
        <div class="roster-name">
          <span>${name}</span>
          ${thisWeek[name] ? '<span class="weekend-badge">This Weekend</span>' : ''}
        </div>
        <div class="roster-bar-track">
          <div class="roster-bar-fill" style="width:${count === 0 ? 0 : Math.max(pct, 2)}%"></div>
        </div>
        <span class="roster-count">${count}</span>
      </div>`;
  }

  if (unmatched.length > 0) {
    html += `
      <div class="unmatched-section">
        <p class="unmatched-label">Not on roster — check spelling:</p>
        ${unmatched.map(n => `<span class="unmatched-tag">${n}</span>`).join('')}
      </div>`;
  }

  container.innerHTML = html;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function loadRosterStats() {
  const season    = getActiveSeason();
  const container = document.getElementById('roster-chart');
  if (!container) return;

  container.innerHTML = '<p class="chart-loading">Loading…</p>';

  try {
    const res = await fetch(
      `${WORKER_URL}/api/signups/range?start=${toISO(season.start)}&end=${toISO(season.end)}`
    );
    if (!res.ok) throw new Error();
    const data  = await res.json();
    const stats = buildStats(data);
    renderChart(stats, season);
  } catch {
    container.innerHTML = '<p class="chart-error">Could not load signup data.</p>';
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function initAdmin() {
  const pinWall      = document.getElementById('pin-wall');
  const pinInput     = document.getElementById('pin-input');
  const pinError     = document.getElementById('pin-error');
  const adminContent = document.getElementById('admin-content');

  function tryPin() {
    if (pinInput.value === ADMIN_PIN) {
      pinWall.hidden       = true;
      adminContent.hidden  = false;
      pinError.textContent = '';
      loadRosterStats();
    } else {
      pinError.textContent = 'Incorrect PIN.';
      pinInput.value       = '';
      pinInput.focus();
    }
  }

  document.getElementById('pin-submit').addEventListener('click', tryPin);
  pinInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') tryPin();
  });
}

document.addEventListener('DOMContentLoaded', initAdmin);
