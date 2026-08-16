/**
 * All D1 database queries for FireCats.
 * Each function receives the D1 binding (env.DB) as its first argument.
 */

export async function getSignupsByDate(db, date) {
  const result = await db
    .prepare('SELECT name FROM signups WHERE date = ? ORDER BY created_at ASC')
    .bind(date)
    .all();
  return result.results.map(r => r.name);
}

export async function getSignupsByRange(db, start, end) {
  const result = await db
    .prepare(
      'SELECT date, name FROM signups WHERE date >= ? AND date <= ? ORDER BY date ASC, created_at ASC'
    )
    .bind(start, end)
    .all();

  // Group names by date
  const grouped = {};
  for (const row of result.results) {
    if (!grouped[row.date]) grouped[row.date] = [];
    grouped[row.date].push(row.name);
  }
  return grouped;
}

export async function addSignup(db, date, name) {
  // Case-insensitive duplicate check
  const existing = await db
    .prepare('SELECT id FROM signups WHERE date = ? AND lower(name) = lower(?)')
    .bind(date, name)
    .first();

  if (existing) {
    return { success: false, error: 'That name is already signed up for this day.' };
  }

  await db
    .prepare('INSERT INTO signups (date, name) VALUES (?, ?)')
    .bind(date, name)
    .run();

  return { success: true };
}

export async function removeSignup(db, date, name) {
  const result = await db
    .prepare('DELETE FROM signups WHERE date = ? AND lower(name) = lower(?)')
    .bind(date, name)
    .run();

  return { success: true, deleted: result.meta.changes > 0 };
}

// ─── Gear Inventory ─────────────────────────────────────────────────────────

const GEAR_BOOL_FIELDS = [
  'pack', 'fire_shelter', 'side_pockets', 'gloves', 'hard_hat',
  'eye_pro', 'ear_pro', 'headlamp', 'duffle_bag', 'greens', 'yellow',
];
const GEAR_TEXT_FIELDS = ['duffle_number', 'greens_size', 'yellow_size'];

export async function getAllGear(db) {
  const result = await db.prepare('SELECT * FROM gear_inventory').all();
  return result.results;
}

export async function upsertGear(db, name, fields) {
  const bools = GEAR_BOOL_FIELDS.map(f => (fields[f] ? 1 : 0));
  const texts = GEAR_TEXT_FIELDS.map(f => (fields[f] || '').trim());

  await db
    .prepare(
      `INSERT INTO gear_inventory
         (name, pack, fire_shelter, side_pockets, gloves, hard_hat, eye_pro, ear_pro, headlamp,
          duffle_bag, duffle_number, greens, greens_size, yellow, yellow_size, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(name) DO UPDATE SET
         pack=excluded.pack, fire_shelter=excluded.fire_shelter, side_pockets=excluded.side_pockets,
         gloves=excluded.gloves, hard_hat=excluded.hard_hat, eye_pro=excluded.eye_pro,
         ear_pro=excluded.ear_pro, headlamp=excluded.headlamp,
         duffle_bag=excluded.duffle_bag, duffle_number=excluded.duffle_number,
         greens=excluded.greens, greens_size=excluded.greens_size,
         yellow=excluded.yellow, yellow_size=excluded.yellow_size,
         updated_at=datetime('now')`
    )
    .bind(
      name,
      bools[0], bools[1], bools[2], bools[3], bools[4], bools[5], bools[6], bools[7],
      bools[8], texts[0], bools[9], texts[1], bools[10], texts[2]
    )
    .run();

  return { success: true };
}
