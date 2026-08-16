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
  'Placeholder Seventeen',
  'Placeholder Eighteen',
  'Placeholder Nineteen',
  'Placeholder Twenty',
];

const GEAR_ITEMS = [
  { key: 'pack',         label: 'Pack' },
  { key: 'fire_shelter', label: 'Fire Shelter' },
  { key: 'side_pockets', label: 'Side Pockets' },
  { key: 'gloves',       label: 'Gloves' },
  { key: 'hard_hat',     label: 'Hard Hat' },
  { key: 'eye_pro',      label: 'Eye Pro' },
  { key: 'ear_pro',      label: 'Ear Pro' },
  { key: 'headlamp',     label: 'Headlamp' },
  { key: 'duffle_bag',   label: 'Duffle Bag', sizeField: 'duffle_number', sizePlaceholder: '#' },
  { key: 'greens',       label: 'Greens',     sizeField: 'greens_size',   sizePlaceholder: 'Size' },
  { key: 'yellow',       label: 'Yellow',     sizeField: 'yellow_size',   sizePlaceholder: 'Size' },
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

// ─── Gear Inventory ─────────────────────────────────────────────────────────

let gearState = {};
const gearSaveTimers = {};

function defaultGearRow() {
  const row = {};
  GEAR_ITEMS.forEach(item => {
    row[item.key] = false;
    if (item.sizeField) row[item.sizeField] = '';
  });
  return row;
}

function renderGearTable() {
  const table = document.getElementById('gear-table');
  if (!table) return;
  table.innerHTML = '';

  const thead   = document.createElement('thead');
  const headRow = document.createElement('tr');
  const nameTh  = document.createElement('th');
  nameTh.className = 'gear-name-col';
  nameTh.textContent = 'Name';
  headRow.appendChild(nameTh);
  GEAR_ITEMS.forEach(item => {
    const th = document.createElement('th');
    th.textContent = item.label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  ROSTER.forEach(name => {
    const tr     = document.createElement('tr');
    const nameTd = document.createElement('td');
    nameTd.className   = 'gear-name-col';
    nameTd.textContent = name;
    tr.appendChild(nameTd);

    GEAR_ITEMS.forEach(item => {
      const td       = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type    = 'checkbox';
      checkbox.checked = !!gearState[name][item.key];
      checkbox.addEventListener('change', () => {
        gearState[name][item.key] = checkbox.checked;
        saveGearRow(name);
      });
      td.appendChild(checkbox);

      if (item.sizeField) {
        const sizeInput = document.createElement('input');
        sizeInput.type        = 'text';
        sizeInput.className   = 'gear-size-input';
        sizeInput.placeholder = item.sizePlaceholder || '';
        sizeInput.value       = gearState[name][item.sizeField] || '';
        sizeInput.addEventListener('change', () => {
          gearState[name][item.sizeField] = sizeInput.value.trim();
          saveGearRow(name);
        });
        td.appendChild(sizeInput);
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

function saveGearRow(name) {
  const status = document.getElementById('gear-status');
  status.textContent = 'Saving…';

  clearTimeout(gearSaveTimers[name]);
  gearSaveTimers[name] = setTimeout(async () => {
    try {
      const res = await fetch(`${WORKER_URL}/api/gear`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, ...gearState[name] }),
      });
      if (!res.ok) throw new Error();
      status.textContent = 'Saved.';
      setTimeout(() => {
        if (status.textContent === 'Saved.') status.textContent = '';
      }, 1500);
    } catch {
      status.textContent = 'Save failed — check connection.';
    }
  }, 400);
}

async function loadGear() {
  const status = document.getElementById('gear-status');
  status.textContent = 'Loading…';

  gearState = {};
  ROSTER.forEach(name => { gearState[name] = defaultGearRow(); });

  try {
    const res = await fetch(`${WORKER_URL}/api/gear`);
    if (!res.ok) throw new Error();
    const rows = await res.json();

    rows.forEach(row => {
      if (!gearState[row.name]) return;
      GEAR_ITEMS.forEach(item => {
        gearState[row.name][item.key] = !!row[item.key];
        if (item.sizeField) gearState[row.name][item.sizeField] = row[item.sizeField] || '';
      });
    });

    renderGearTable();
    status.textContent = '';
  } catch {
    status.textContent = 'Could not load gear inventory.';
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
      loadGear();
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
