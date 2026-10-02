import { kindleLink } from '../kindle-link';
import type { Db } from './db';

export interface AwardBook {
	title: string;
	author: string;
	kindleUrl: string;
	awards: { award: string; year: number; result: 'won' | 'shortlisted' }[];
}

/** Every award novel, newest award year first, then by title. */
export function listAwardBooks(db: Db): AwardBook[] {
	const rows = db
		.prepare(
			`SELECT w.id, w.title, w.author, a.award, a.year, a.result,
			        MAX(a.year) OVER (PARTITION BY w.id) AS newest
			   FROM work w JOIN award_entry a ON a.work_id = w.id
			  ORDER BY newest DESC, w.title, a.year DESC, a.award`
		)
		.all() as { id: number; title: string; author: string; award: string; year: number; result: 'won' | 'shortlisted' }[];

	const books = new Map<number, AwardBook>();
	for (const row of rows) {
		const book = books.get(row.id) ?? {
			title: row.title,
			author: row.author,
			kindleUrl: kindleLink(row.title, row.author),
			awards: []
		};
		book.awards.push({ award: row.award, year: row.year, result: row.result });
		books.set(row.id, book);
	}
	return [...books.values()];
}
