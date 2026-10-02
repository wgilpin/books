-- One mark per book: owned, read, rejected or queued. Keyed by source and source_id,
-- so it survives a rebuild of the work table (ADR 0002). Replaces owned_override.
CREATE TABLE book_mark (
	source TEXT NOT NULL,
	source_id TEXT NOT NULL,
	mark TEXT NOT NULL CHECK (mark IN ('owned', 'read', 'rejected', 'queued')),
	marked_at TEXT NOT NULL,
	PRIMARY KEY (source, source_id)
);

INSERT INTO book_mark (source, source_id, mark, marked_at)
SELECT source, source_id, 'owned', created_at FROM owned_override;

DROP TABLE owned_override;
