import { fail } from '@sveltejs/kit';
import type { Genre } from '../genre';
import type { Db } from './db';

export const GENRE_CHOICES = { sf: { sf: true, fantasy: false }, fantasy: { sf: false, fantasy: true }, both: { sf: true, fantasy: true } } as const;
export type GenreChoice = keyof typeof GENRE_CHOICES;

const isChoice = (value: unknown): value is GenreChoice => typeof value === 'string' && value in GENRE_CHOICES;

/** Sets the genre of each given book by hand. A later setting replaces an earlier one. */
export function setGenre(db: Db, books: { source: string; sourceId: string }[], choice: GenreChoice) {
	if (!isChoice(choice)) throw new Error(`Unknown genre ${String(choice)}`);
	const { sf, fantasy } = GENRE_CHOICES[choice];
	const upsert = db.prepare(
		`INSERT INTO genre_override (source, source_id, sf, fantasy, set_at) VALUES (?, ?, ?, ?, datetime('now'))
		 ON CONFLICT (source, source_id) DO UPDATE SET sf = excluded.sf, fantasy = excluded.fantasy, set_at = excluded.set_at`
	);
	db.transaction(() => {
		for (const book of books) upsert.run(book.source, book.sourceId, Number(sf), Number(fantasy));
	})();
}

/** Every set genre, keyed "source|sourceId". */
export function genreOverrides(db: Db): Map<string, Genre> {
	const rows = db.prepare('SELECT source, source_id AS sourceId, sf, fantasy FROM genre_override').all() as {
		source: string;
		sourceId: string;
		sf: number;
		fantasy: number;
	}[];
	return new Map(rows.map((row) => [`${row.source}|${row.sourceId}`, { sf: !!row.sf, fantasy: !!row.fantasy }]));
}

/** The form action behind the genre buttons: one or more `work` keys and a `genre` choice. */
export async function genreFromForm(db: Db, request: Request) {
	const form = await request.formData();
	const books = form
		.getAll('work')
		.filter((value): value is string => typeof value === 'string' && value.includes('|'))
		.map((value) => {
			const [source, sourceId] = value.split('|');
			return { source, sourceId };
		});
	const choice = form.get('genre');
	if (books.length === 0) return fail(400, { error: 'No book given' });
	if (!isChoice(choice)) return fail(400, { error: 'Unknown genre' });
	setGenre(db, books, choice);
	return { genreSet: choice };
}
