import { getDb } from '#lib/server/db.js';
import { listQueue, markFromForm } from '#lib/server/marks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({ books: listQueue(getDb(), locals?.user ?? '1') });

export const actions: Actions = {
	mark: async ({ request, locals }) => markFromForm(getDb(), request, locals?.user ?? '1')
};
