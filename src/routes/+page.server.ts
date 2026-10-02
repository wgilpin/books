import { listAwardBooks } from '#lib/server/books.js';
import { getDb } from '#lib/server/db.js';
import { markFromForm } from '#lib/server/marks.js';
import { latestRefresh, startRefresh } from '#lib/server/refresh.js';
import type { Actions, PageServerLoad } from './$types';

const GENRES = ['sf', 'fantasy'] as const;
type GenreParam = (typeof GENRES)[number];

export const load: PageServerLoad = async ({ url }) => {
	const db = getDb();
	const param = url.searchParams.get('genre');
	const genre = GENRES.includes(param as GenreParam) ? (param as GenreParam) : null;
	return { books: listAwardBooks(db, 10, genre ?? undefined), refresh: latestRefresh(db), genre };
};

export const actions: Actions = {
	refresh: async () => {
		const { started } = startRefresh(getDb());
		return { started };
	},
	mark: async ({ request }) => markFromForm(getDb(), request)
};
