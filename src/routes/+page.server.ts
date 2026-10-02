import { fail } from '@sveltejs/kit';
import { listAwardBooks } from '#lib/server/books.js';
import { getDb } from '#lib/server/db.js';
import { markOwned } from '#lib/server/owned.js';
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
	},
	own: async ({ request }) => {
		const form = await request.formData();
		const source = form.get('source');
		const sourceId = form.get('sourceId');
		if (typeof source !== 'string' || typeof sourceId !== 'string' || !source || !sourceId) {
			return fail(400, { error: 'No book given' });
		}
		markOwned(getDb(), source, sourceId);
		return { owned: sourceId };
	}
};
