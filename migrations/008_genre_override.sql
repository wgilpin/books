-- Genres I set by hand for books Wikidata left unknown. Wins over the labels.
-- Keyed by source and source_id, so it survives every refresh (ADR 0002).
CREATE TABLE genre_override (
	source TEXT NOT NULL,
	source_id TEXT NOT NULL,
	sf INTEGER NOT NULL CHECK (sf IN (0, 1)),
	fantasy INTEGER NOT NULL CHECK (fantasy IN (0, 1)),
	set_at TEXT NOT NULL,
	PRIMARY KEY (source, source_id)
);
