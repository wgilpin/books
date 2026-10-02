import { kindleLink } from '../kindle-link';
import { ownedIndex, type OwnedBook } from '../match';
import type { Db } from './db';

export interface AwardBook {
	title: string;
	author: string;
	kindleUrl: string;
	awards: { award: string; year: number; result: 'won' | 'shortlisted' }[];
}

/** Award novels I do not own, newest award year first, then by title, cut to `limit`. */
export function listAwardBooks(db: Db, limit = 10): AwardBook[] {
	const rows = db
		.prepare(
			`SELECT w.id, w.title, w.author, a.award, a.year, a.result,
			        MAX(a.year) OVER (PARTITION BY w.id) AS newest
			   FROM work w JOIN award_entry a ON a.work_id = w.id
			  ORDER BY newest DESC, w.title, w.id, a.year DESC, a.award`
		)
		.all() as { id: number; title: string; author: string; award: string; year: number; result: 'won' | 'shortlisted' }[];

	const aliases = new Map<number, string[]>();
	for (const { work_id, alias } of db.prepare('SELECT work_id, alias FROM work_alias').all() as {
		work_id: number;
		alias: string;
	}[]) {
		aliases.set(work_id, [...(aliases.get(work_id) ?? []), alias]);
	}
	const owned = ownedIndex(db.prepare('SELECT title, authors FROM owned').all() as OwnedBook[]);

	const books = new Map<number, AwardBook>();
	const skipped = new Set<number>();
	for (const row of rows) {
		if (skipped.has(row.id)) continue;
		let book = books.get(row.id);
		if (!book) {
			if (owned.owns({ title: row.title, author: row.author, aliases: aliases.get(row.id) ?? [] })) {
				skipped.add(row.id);
				continue;
			}
			if (books.size >= limit) break;
			book = { title: row.title, author: row.author, kindleUrl: kindleLink(row.title, row.author), awards: [] };
			books.set(row.id, book);
		}
		book.awards.push({ award: row.award, year: row.year, result: row.result });
	}
	return [...books.values()];
}
