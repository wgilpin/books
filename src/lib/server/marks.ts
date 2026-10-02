import { fail } from '@sveltejs/kit';
import { kindleLink } from '../kindle-link';
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

/** The form action behind every mark button: source, sourceId and mark from the form. */
export async function markFromForm(db: Db, request: Request) {
	const form = await request.formData();
	const source = form.get('source');
	const sourceId = form.get('sourceId');
	const mark = form.get('mark');
	if (typeof source !== 'string' || typeof sourceId !== 'string' || !source || !sourceId) {
		return fail(400, { error: 'No book given' });
	}
	if (!isMark(mark)) return fail(400, { error: 'Unknown mark' });
	markBook(db, source, sourceId, mark);
	return { marked: sourceId, mark };
}

export function queueCount(db: Db): number {
	return db.prepare("SELECT COUNT(*) FROM book_mark WHERE mark = 'queued'").pluck().get() as number;
}

export interface QueuedBook {
	source: string;
	sourceId: string;
	title: string;
	author: string;
	kindleUrl: string;
	series: { name: string; position: number } | null;
	awards: never[];
}

/** Queued books, newest queued first, with their most specific series. */
export function listQueue(db: Db): QueuedBook[] {
	const rows = db
		.prepare(
			`SELECT w.source, w.source_id AS sourceId, w.title, w.author,
			        (SELECT s.name FROM series_entry e JOIN series s ON s.id = e.series_id WHERE e.work_id = w.id
			          ORDER BY (SELECT COUNT(*) FROM series_entry x WHERE x.series_id = s.id), s.name LIMIT 1) AS seriesName,
			        (SELECT e.position FROM series_entry e JOIN series s ON s.id = e.series_id WHERE e.work_id = w.id
			          ORDER BY (SELECT COUNT(*) FROM series_entry x WHERE x.series_id = s.id), s.name LIMIT 1) AS position
			   FROM book_mark m JOIN work w ON w.source = m.source AND w.source_id = m.source_id
			  WHERE m.mark = 'queued'
			  ORDER BY m.marked_at DESC, m.rowid DESC`
		)
		.all() as { source: string; sourceId: string; title: string; author: string; seriesName: string | null; position: number | null }[];
	return rows.map((row) => ({
		source: row.source,
		sourceId: row.sourceId,
		title: row.title,
		author: row.author,
		kindleUrl: kindleLink(row.title, row.author),
		series: row.seriesName ? { name: row.seriesName, position: row.position! } : null,
		awards: []
	}));
}
