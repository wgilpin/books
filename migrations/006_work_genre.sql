-- Raw Wikidata genre labels of award books. src/lib/genre.ts classifies them.
CREATE TABLE work_genre (
	work_id INTEGER NOT NULL REFERENCES work (id) ON DELETE CASCADE,
	label TEXT NOT NULL,
	PRIMARY KEY (work_id, label)
);
