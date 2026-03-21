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
