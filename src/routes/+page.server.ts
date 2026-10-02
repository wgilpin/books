import { listAwardBooks } from '#lib/server/books.js';
import { getDb } from '#lib/server/db.js';
import { latestRefresh, startRefresh } from '#lib/server/refresh.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const db = getDb();
	return { books: listAwardBooks(db), refresh: latestRefresh(db) };
};

export const actions: Actions = {
	refresh: async () => {
		const { started } = startRefresh(getDb());
		return { started };
	}
};
