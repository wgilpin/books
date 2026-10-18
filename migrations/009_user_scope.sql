-- Scope owned books, import history and marks by user ('1' or '2').
-- Existing single-user rows become user '1'.
CREATE TABLE owned_new (
	user TEXT NOT NULL DEFAULT '1',
	asin TEXT NOT NULL,
	title TEXT NOT NULL,
	authors TEXT NOT NULL,
	PRIMARY KEY (user, asin)
);

INSERT INTO owned_new (user, asin, title, authors)
SELECT '1', asin, title, authors FROM owned;

DROP TABLE owned;
ALTER TABLE owned_new RENAME TO owned;

CREATE TABLE owned_import_new (
	id INTEGER PRIMARY KEY,
	user TEXT NOT NULL DEFAULT '1',
	imported_at TEXT NOT NULL,
	count INTEGER NOT NULL
);

INSERT INTO owned_import_new (id, user, imported_at, count)
SELECT id, '1', imported_at, count FROM owned_import;

DROP TABLE owned_import;
ALTER TABLE owned_import_new RENAME TO owned_import;

CREATE TABLE book_mark_new (
	user TEXT NOT NULL DEFAULT '1',
	source TEXT NOT NULL,
	source_id TEXT NOT NULL,
	mark TEXT NOT NULL CHECK (mark IN ('owned', 'read', 'rejected', 'queued')),
	marked_at TEXT NOT NULL,
	PRIMARY KEY (user, source, source_id)
);

INSERT INTO book_mark_new (user, source, source_id, mark, marked_at)
SELECT '1', source, source_id, mark, marked_at FROM book_mark;

DROP TABLE book_mark;
ALTER TABLE book_mark_new RENAME TO book_mark;
