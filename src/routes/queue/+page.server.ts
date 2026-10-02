import { getDb } from '#lib/server/db.js';
import { listQueue, markFromForm } from '#lib/server/marks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ books: listQueue(getDb()) });

export const actions: Actions = {
	mark: async ({ request }) => markFromForm(getDb(), request)
};
