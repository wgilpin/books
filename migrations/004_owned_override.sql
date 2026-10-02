-- Works I marked "I own this". Keyed by source and source_id, so it survives a
-- rebuild of the work table and every Kindle import (ADR 0002).
CREATE TABLE owned_override (
	source TEXT NOT NULL,
	source_id TEXT NOT NULL,
	created_at TEXT NOT NULL,
	PRIMARY KEY (source, source_id)
);
