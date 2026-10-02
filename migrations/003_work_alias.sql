-- Other names of a work, for matching store titles. A refresh replaces them.
CREATE TABLE work_alias (
	work_id INTEGER NOT NULL REFERENCES work (id) ON DELETE CASCADE,
	alias TEXT NOT NULL,
	PRIMARY KEY (work_id, alias)
);
