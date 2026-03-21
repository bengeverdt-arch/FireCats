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
