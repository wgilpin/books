import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '#lib/server/db.js';
import { startRefresh } from '#lib/server/refresh.js';
import { load } from './+page.server';

const fixture = readFileSync('tests/fixtures/wikidata-award-novels.json', 'utf8');
const okFetch = (async () => new Response(fixture)) as typeof fetch;
const failingFetch = (async () => {
	throw new Error('network down');
}) as typeof fetch;

const run = () => load({} as Parameters<typeof load>[0]) as Promise<Record<string, any>>;

describe('/ load', () => {
	beforeEach(() => {
		getDb().exec('DELETE FROM award_entry; DELETE FROM work; DELETE FROM refresh_log; DELETE FROM source_cache;');
	});

	it('returns no books and no refresh on an empty database', async () => {
		expect(await run()).toEqual({ books: [], refresh: null });
	});

	it('returns the books newest award year first, each with its entries and Kindle link', async () => {
		await startRefresh(getDb(), okFetch).done;
		const { books } = await run();

		expect(books).toHaveLength(36);
		const years = books.map((b: any) => Math.max(...b.awards.map((a: any) => a.year)));
		expect(years).toEqual([...years].sort((a, b) => b - a));
		expect(books.find((b: any) => b.title === 'Venomous Lumpsucker')).toEqual({
			title: 'Venomous Lumpsucker',
			author: 'Ned Beauman',
			kindleUrl: 'https://www.amazon.co.uk/s?k=Venomous+Lumpsucker+Ned+Beauman&i=digital-text',
			awards: [{ award: 'Clarke', year: 2023, result: 'won' }]
		});
	});

	it('returns the error and keeps the books after a failed refresh', async () => {
		await startRefresh(getDb(), okFetch).done;
		await startRefresh(getDb(), failingFetch).done;
		const data = await run();

		expect(data.books).toHaveLength(36);
		expect(data.refresh).toMatchObject({ status: 'failed', error: 'network down' });
	});
});
