import { listAwardBooks } from '#lib/server/books.js';
import { getDb } from '#lib/server/db.js';
import { genreFromForm } from '#lib/server/genres.js';
import { markFromForm } from '#lib/server/marks.js';
import { latestRefresh, startRefresh } from '#lib/server/refresh.js';
import type { Actions, PageServerLoad } from './$types';

const GENRES = ['sf', 'fantasy'] as const;
const PAGE = 10;
const MAX_LIMIT = 200;

/** Entries to show: a positive whole number from ?limit=, ten by default, at most 200. */
function limitFrom(url: URL): number {
	const value = Number(url.searchParams.get('limit'));
	return Number.isInteger(value) && value > 0 ? Math.min(value, MAX_LIMIT) : PAGE;
}
type GenreParam = (typeof GENRES)[number];

export const load: PageServerLoad = async ({ url, locals }) => {
	const db = getDb();
	const param = url.searchParams.get('genre');
	const genre = GENRES.includes(param as GenreParam) ? (param as GenreParam) : null;
	const includeUnknown = url.searchParams.get('unknown') !== '0';
	const limit = limitFrom(url);
	// One extra entry tells the page whether a "Show more" link has anything to show.
	const books = listAwardBooks(db, limit + 1, { genre: genre ?? undefined, includeUnknown, user: locals?.user ?? '1' });
	return {
		books: books.slice(0, limit),
		refresh: latestRefresh(db),
		genre,
		includeUnknown,
		limit,
		hasMore: books.length > limit
	};
};

export const actions: Actions = {
	refresh: async () => {
		const { started } = startRefresh(getDb());
		return { started };
	},
	mark: async ({ request, locals }) => markFromForm(getDb(), request, locals?.user ?? '1'),
	genre: async ({ request }) => genreFromForm(getDb(), request)
};
