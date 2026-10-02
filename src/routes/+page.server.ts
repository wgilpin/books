import { getDb } from '#lib/server/db.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const lastRefresh =
		(getDb()
			.prepare("SELECT finished_at FROM refresh_log WHERE status = 'ok' ORDER BY id DESC LIMIT 1")
			.pluck()
			.get() as string | undefined) ?? null;
	return { books: [], lastRefresh };
};

export const actions: Actions = {
	// The Wikidata refresh arrives in epic 02.
	refresh: async () => {}
};
