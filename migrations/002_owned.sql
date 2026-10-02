-- Books I own on Kindle. Each import replaces the whole table.
CREATE TABLE owned (
	id INTEGER PRIMARY KEY,
	asin TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL,
	authors TEXT NOT NULL -- '; ' between authors, as the Kindle export writes them
);

CREATE TABLE owned_import (
	id INTEGER PRIMARY KEY,
	imported_at TEXT NOT NULL,
	count INTEGER NOT NULL
);
