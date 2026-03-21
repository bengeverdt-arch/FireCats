# FireCats — Crew Availability Calendar

A web-based sign-up calendar for the 16-person wildland fire crew in Eastern Kentucky. Shows only Saturdays and Sundays within the two Kentucky fire seasons. No login required — anyone with the link can sign up or remove a name.

---

## Project Structure

```
FireCats/
├── frontend/
│   ├── index.html      — page shell, modals, toast
│   ├── calendar.js     — season logic, rendering, interactions
│   ├── api.js          — all fetch calls to the Worker
│   └── styles.css      — dark/ember theme, mobile-first
├── worker/
│   ├── index.js        — Worker entry point, URL routing
│   ├── db.js           — all D1 queries
│   └── cors.js         — CORS headers + JSON response helper
├── schema.sql          — D1 table schema (run once)
├── wrangler.toml       — Worker config
└── README.md
```

---

## Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated (`wrangler login`)
- A Cloudflare account with Workers and Pages access

---

## Step 1 — Create the D1 Database

```bash
wrangler d1 create firecats-db
```

Wrangler will print output like:

```
✅ Successfully created DB 'firecats-db'

[[d1_databases]]
binding = "DB"
database_name = "firecats-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy the `database_id` value and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding       = "DB"
database_name = "firecats-db"
database_id   = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"   # ← paste here
```

---

## Step 2 — Run the Schema

```bash
wrangler d1 execute firecats-db --file=schema.sql
```

This creates the `signups` table. Run it once. If you need to reset the database later, run the same command after dropping the table manually.

To verify the table was created:

```bash
wrangler d1 execute firecats-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

## Step 3 — Deploy the Worker

```bash
wrangler deploy
```

Wrangler will print your Worker URL, which looks like:

```
https://firecats-worker.<your-subdomain>.workers.dev
```

Copy that URL — you'll need it in Step 4.

---

## Step 4 — Update the Frontend with Your Worker URL

Open `frontend/api.js` and replace the placeholder at the top:

```js
// Before
const WORKER_URL = 'https://firecats-worker.YOUR-SUBDOMAIN.workers.dev';

// After — paste your actual Worker URL
const WORKER_URL = 'https://firecats-worker.your-actual-subdomain.workers.dev';
```

Save the file.

---

## Step 5 — Deploy the Frontend to Cloudflare Pages (Zip Upload)

1. Zip the contents of the `frontend/` folder (not the folder itself — zip the files inside it so `index.html` is at the root of the zip).

   On Windows, open the `frontend/` folder, select all four files, right-click → Send to → Compressed (zipped) folder.

2. Go to [Cloudflare Pages](https://pages.cloudflare.com/) in your dashboard.

3. Click **Create a project** → **Upload assets**.

4. Give the project a name (e.g. `firecats`), upload your zip, and deploy.

5. Cloudflare will give you a URL like `https://firecats.pages.dev`. Share that with your crew.

---

## Bindings & Environment Variables

| Name | Type | Description |
|------|------|-------------|
| `DB` | D1 Database | The `firecats-db` D1 database. Configured in `wrangler.toml`. |

No secret environment variables are required. There is no authentication.

---

## How It Works

**Fire seasons shown:**
- Spring: February 15 – April 30
- Fall: October 1 – December 15

The calendar automatically shows the current active season, or the next upcoming season if you're between seasons. Past dates within the season stay visible but are locked (read-only).

**Sign up:** Tap any future day tile → tap "+ Sign Up" → type your name → confirm.

**Remove:** Tap any name on a future day → confirm removal.

Changes are optimistic — they appear immediately in the UI and sync to the database in the background.

---

## Updating After Deployment

**Worker changes:** Edit files in `worker/`, then run `wrangler deploy` again.

**Frontend changes:** Edit files in `frontend/`, re-zip the four files, and re-upload to Cloudflare Pages (go to your project → Deployments → Upload).

---

## Future Integration (Fire Radar)

This project is built for standalone deployment but is structured for easy module integration into the Fire Radar dashboard:

- `frontend/` files are self-contained with no framework dependencies
- `worker/` routes are isolated under `/api/signups` — no conflicts expected
- The D1 database can be shared or kept separate depending on Fire Radar's architecture
