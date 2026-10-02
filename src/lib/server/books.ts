import { buildEntries, type AwardBookInput, type Entry, type GenreFilter, type SeriesMemberInput } from '../discover';
import { classifyGenre } from '../genre';
import { kindleLink } from '../kindle-link';
import { ownedIndex, type OwnedBook } from '../match';
import type { Db } from './db';
import { marksBySource } from './marks';

export type AwardBook = Entry & { kindleUrl: string };

/**
 * The list: award books and series I do not own (Kindle match or a mark), one entry per
 * series, newest award year first, cut to `limit`. Marks win over the Kindle match. The rule itself lives in discover.ts.
 */
export function listAwardBooks(db: Db, limit = 10, genre?: GenreFilter): AwardBook[] {
	const aliases = new Map<number, string[]>();
	for (const { work_id, alias } of db.prepare('SELECT work_id, alias FROM work_alias').all() as {
		work_id: number;
		alias: string;
	}[]) {
		aliases.set(work_id, [...(aliases.get(work_id) ?? []), alias]);
	}

	const labels = new Map<number, string[]>();
	for (const { work_id, label } of db.prepare('SELECT work_id, label FROM work_genre').all() as {
		work_id: number;
		label: string;
	}[]) {
		labels.set(work_id, [...(labels.get(work_id) ?? []), label]);
	}

	const awardRows = db
		.prepare(
			`SELECT w.id, w.source, w.source_id AS sourceId, w.title, w.author, a.award, a.year, a.result
			   FROM work w JOIN award_entry a ON a.work_id = w.id
			  ORDER BY w.id, a.year DESC, a.award`
		)
		.all() as { id: number; source: string; sourceId: string; title: string; author: string; award: string; year: number; result: 'won' | 'shortlisted' }[];
	const awardBooks = new Map<number, AwardBookInput>();
	for (const row of awardRows) {
		const book = awardBooks.get(row.id) ?? {
			source: row.source,
			sourceId: row.sourceId,
			title: row.title,
			author: row.author,
			aliases: aliases.get(row.id) ?? [],
			awards: [],
			genre: { sf: false, fantasy: false }
		};
		book.awards.push({ award: row.award, year: row.year, result: row.result });
		awardBooks.set(row.id, book);
	}
	for (const [id, book] of awardBooks) book.genre = classifyGenre(labels.get(id) ?? [], book.awards);

	const members = (
		db
			.prepare(
				`SELECT s.id AS seriesId, s.name AS seriesName, e.position, w.id, w.source, w.source_id AS sourceId, w.title, w.author
				   FROM series s JOIN series_entry e ON e.series_id = s.id JOIN work w ON w.id = e.work_id`
			)
			.all() as { seriesId: number; seriesName: string; position: number; id: number; source: string; sourceId: string; title: string; author: string }[]
	).map(
		(row): SeriesMemberInput => ({
			seriesKey: String(row.seriesId),
			seriesName: row.seriesName,
			position: row.position,
			work: { source: row.source, sourceId: row.sourceId, title: row.title, author: row.author, aliases: aliases.get(row.id) ?? [] }
		})
	);

	const kindle = ownedIndex(db.prepare('SELECT title, authors FROM owned').all() as OwnedBook[]);
	const marks = marksBySource(db);

	return buildEntries({
		awardBooks: [...awardBooks.values()],
		members,
		markOf: (work) => marks.get(`${work.source}|${work.sourceId}`) ?? (kindle.owns(work) ? 'owned' : undefined),
		limit,
		genre
	}).map((entry) => ({ ...entry, kindleUrl: kindleLink(entry.title, entry.author) }));
}
