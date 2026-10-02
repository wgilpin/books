-- Series that hold an award book, and their numbered members. A refresh replaces the
-- entries; members without an award are plain works with no award_entry.
CREATE TABLE series (
	id INTEGER PRIMARY KEY,
	source TEXT NOT NULL,
	source_id TEXT NOT NULL,
	name TEXT NOT NULL,
	UNIQUE (source, source_id)
);

CREATE TABLE series_entry (
	series_id INTEGER NOT NULL REFERENCES series (id) ON DELETE CASCADE,
	work_id INTEGER NOT NULL REFERENCES work (id) ON DELETE CASCADE,
	position REAL NOT NULL,
	PRIMARY KEY (series_id, work_id)
);

CREATE INDEX series_entry_work ON series_entry (work_id);
