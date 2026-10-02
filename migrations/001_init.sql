-- Every row from a source carries source and source_id, unique together.
-- A refresh upserts on that pair, so internal ids stay stable (ADR 0002).

CREATE TABLE work (
	id INTEGER PRIMARY KEY,
	source TEXT NOT NULL,
	source_id TEXT NOT NULL,
	title TEXT NOT NULL,
	author TEXT NOT NULL,
	UNIQUE (source, source_id)
);

CREATE TABLE award_entry (
	id INTEGER PRIMARY KEY,
	work_id INTEGER NOT NULL REFERENCES work (id) ON DELETE CASCADE,
	award TEXT NOT NULL,
	year INTEGER NOT NULL,
	result TEXT NOT NULL CHECK (result IN ('won', 'shortlisted')),
	source TEXT NOT NULL,
	source_id TEXT NOT NULL,
	UNIQUE (source, source_id)
);

CREATE INDEX award_entry_year ON award_entry (year);

CREATE TABLE source_cache (
	id INTEGER PRIMARY KEY,
	source TEXT NOT NULL,
	query TEXT NOT NULL,
	fetched_at TEXT NOT NULL,
	body TEXT NOT NULL
);

CREATE TABLE refresh_log (
	id INTEGER PRIMARY KEY,
	source TEXT NOT NULL,
	started_at TEXT NOT NULL,
	finished_at TEXT,
	status TEXT NOT NULL CHECK (status IN ('running', 'ok', 'failed')),
	error TEXT
);
