import type { Db } from './db';

export const MARKS = ['owned', 'read', 'rejected', 'queued'] as const;
export type Mark = (typeof MARKS)[number];

export const isMark = (value: unknown): value is Mark => MARKS.includes(value as Mark);

/** Sets the mark on a book. A new mark replaces the old one. */
export function markBook(db: Db, source: string, sourceId: string, mark: Mark) {
	if (!isMark(mark)) throw new Error(`Unknown mark ${String(mark)}`);
	db.prepare(
		`INSERT INTO book_mark (source, source_id, mark, marked_at) VALUES (?, ?, ?, datetime('now'))
		 ON CONFLICT (source, source_id) DO UPDATE SET mark = excluded.mark, marked_at = excluded.marked_at`
	).run(source, sourceId, mark);
}

/** Every mark, keyed "source|sourceId". */
export function marksBySource(db: Db): Map<string, Mark> {
	const rows = db.prepare('SELECT source, source_id AS sourceId, mark FROM book_mark').all() as {
		source: string;
		sourceId: string;
		mark: Mark;
	}[];
	return new Map(rows.map((row) => [`${row.source}|${row.sourceId}`, row.mark]));
}
