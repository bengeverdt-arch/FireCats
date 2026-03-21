/**
 * All fetch calls to the FireCats Cloudflare Worker.
 *
 * IMPORTANT: After deploying your Worker with `wrangler deploy`, update
 * WORKER_URL below with your live Worker URL. It will look like:
 *   https://firecats-worker.<your-subdomain>.workers.dev
 */
const WORKER_URL = 'https://firecats-worker.bengeverdt.workers.dev';

export async function fetchSignupsForRange(start, end) {
  const res = await fetch(`${WORKER_URL}/api/signups/range?start=${start}&end=${end}`);
  if (!res.ok) throw new Error('Failed to fetch signups.');
  return res.json();
}

export async function addSignup(date, name) {
  const res = await fetch(`${WORKER_URL}/api/signups`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ date, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add signup.');
  return data;
}

export async function removeSignup(date, name) {
  const res = await fetch(`${WORKER_URL}/api/signups`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ date, name }),
  });
  if (!res.ok) throw new Error('Failed to remove signup.');
  return res.json();
}
