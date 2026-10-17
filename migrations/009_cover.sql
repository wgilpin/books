-- Open Library cover ids, looked up the first time a card shows the work.
-- cover_id is NULL when Open Library has no cover, so the lookup does not repeat.
CREATE TABLE work_cover (
	work_id INTEGER PRIMARY KEY REFERENCES work (id) ON DELETE CASCADE,
	cover_id INTEGER,
	fetched_at TEXT NOT NULL
);
