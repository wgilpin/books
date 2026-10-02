import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '#lib/server/db.js';
import { actions, load } from './+page.server';

const sample = readFileSync('tests/fixtures/kindle-sample.csv', 'utf8');

function upload(text: string, name = 'kindle_books.csv') {
	const form = new FormData();
	form.set('file', new File([text], name, { type: 'text/csv' }));
	const request = new Request('http://localhost:3000/import', { method: 'POST', body: form });
	return actions.default({ request } as Parameters<typeof actions.default>[0]) as Promise<any>;
}

const asins = () => getDb().prepare('SELECT asin FROM owned ORDER BY asin').pluck().all();
const loadImport = () => load({} as Parameters<typeof load>[0]) as Promise<any>;

describe('/import', () => {
	beforeEach(() => {
		getDb().exec('DELETE FROM owned; DELETE FROM owned_import;');
	});

	it('shows no owned books and no import before the first upload', async () => {
		expect(await loadImport()).toEqual({ count: 0, importedAt: null });
	});

	it('replaces the owned list with the uploaded books and reports the count', async () => {
		await upload('asin,title,author\n"OLD1","Old book","Old, Author"');
		const result = await upload(sample);

		expect(result).toEqual({ imported: 5 });
		expect(asins()).toEqual(['B000000001', 'B000000002', 'B000000003', 'B000000004', 'B000000005']);
		expect(await loadImport()).toMatchObject({ count: 5, importedAt: expect.any(String) });
	});

	it('rejects a file with the wrong header and keeps the old list', async () => {
		await upload(sample);
		const result = await upload('ASIN,Title,Authors\n"B9","x","y"', 'gist.csv');

		expect(result.status).toBe(400);
		expect(result.data).toEqual({ error: 'Expected the header asin,title,author' });
		expect(asins()).toHaveLength(5);
	});

	it('rejects a form with no file', async () => {
		const request = new Request('http://localhost:3000/import', { method: 'POST', body: new FormData() });
		const result = (await actions.default({ request } as Parameters<typeof actions.default>[0])) as any;
		expect(result.status).toBe(400);
		expect(result.data).toEqual({ error: 'Choose the kindle_books.csv file first' });
	});
});
