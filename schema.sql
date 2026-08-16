-- FireCats Crew Availability Calendar
-- Run this once against your D1 database to initialize the schema.
-- Command: wrangler d1 execute firecats-db --file=schema.sql

CREATE TABLE IF NOT EXISTS signups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT    NOT NULL,                          -- ISO format: YYYY-MM-DD
  name       TEXT    NOT NULL,
  created_at TEXT    DEFAULT (datetime('now'))
);

-- Enforce one signup per person per day (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_signups_date_name
  ON signups (date, lower(name));

CREATE TABLE IF NOT EXISTS gear_inventory (
  name           TEXT    PRIMARY KEY,                    -- must match a ROSTER entry in admin.js
  pack           INTEGER NOT NULL DEFAULT 0,
  fire_shelter   INTEGER NOT NULL DEFAULT 0,
  side_pockets   INTEGER NOT NULL DEFAULT 0,
  gloves         INTEGER NOT NULL DEFAULT 0,
  hard_hat       INTEGER NOT NULL DEFAULT 0,
  eye_pro        INTEGER NOT NULL DEFAULT 0,
  ear_pro        INTEGER NOT NULL DEFAULT 0,
  headlamp       INTEGER NOT NULL DEFAULT 0,
  duffle_bag     INTEGER NOT NULL DEFAULT 0,
  duffle_number  TEXT    NOT NULL DEFAULT '',
  greens         INTEGER NOT NULL DEFAULT 0,
  greens_size    TEXT    NOT NULL DEFAULT '',
  yellow         INTEGER NOT NULL DEFAULT 0,
  yellow_size    TEXT    NOT NULL DEFAULT '',
  updated_at     TEXT    DEFAULT (datetime('now'))
);
