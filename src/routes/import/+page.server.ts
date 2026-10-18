import { fail } from '@sveltejs/kit';
import { getDb } from '#lib/server/db.js';
import { parseKindleCsv } from '#lib/server/kindle.js';
import { ownedSummary, replaceOwned } from '#lib/server/owned.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ownedSummary(getDb(), locals?.user ?? '1');

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const file = (await request.formData()).get('file');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Choose the kindle_books.csv file first' });
		}
		try {
			const imported = replaceOwned(getDb(), parseKindleCsv(await file.text()), locals?.user ?? '1');
			return { imported };
		} catch (error) {
			return fail(400, { error: error instanceof Error ? error.message : String(error) });
		}
	}
};
