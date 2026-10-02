import { beforeEach, describe, expect, it } from 'vitest';
import { fakeWikidata } from '../../tests/fake-wikidata';
import { getDb } from '#lib/server/db.js';
import { listAwardBooks } from '#lib/server/books.js';
import { replaceOwned } from '#lib/server/owned.js';
import { startRefresh } from '#lib/server/refresh.js';
import { actions, load } from './+page.server';

// Wikidata is the edge of the system, so tests replace fetch. Nothing calls the real service.
const okFetch = fakeWikidata();
const failingFetch = (async () => {
	throw new Error('network down');
}) as typeof fetch;

const run = () => load({} as Parameters<typeof load>[0]) as Promise<Record<string, any>>;

describe('/ load', () => {
	beforeEach(() => {
		getDb().exec(
			'DELETE FROM work_alias; DELETE FROM award_entry; DELETE FROM work; DELETE FROM refresh_log; DELETE FROM source_cache; DELETE FROM owned; DELETE FROM owned_override;'
		);
	});

	it('returns no books and no refresh on an empty database', async () => {
		expect(await run()).toEqual({ books: [], refresh: null });
	});

	it('returns the ten newest award books, newest award year first, each with entries and Kindle link', async () => {
		await startRefresh(getDb(), okFetch).done;
		const { books } = await run();

		expect(books).toHaveLength(10);
		const years = books.map((b: any) => Math.max(...b.awards.map((a: any) => a.year)));
		expect(years).toEqual([...years].sort((a, b) => b - a));
		expect(years.every((y: number) => y === 2024)).toBe(true);
		expect(books[0]).toEqual({
			source: 'wikidata',
			sourceId: expect.stringMatching(/^Q\d+$/),
			title: expect.any(String),
			author: expect.any(String),
			kindleUrl: expect.stringMatching(/^https:\/\/www\.amazon\.co\.uk\/s\?k=.+&i=digital-text$/),
			awards: [expect.objectContaining({ year: 2024 })],
			series: null
		});
	});

	it('leaves out the award books I own, matched by author and title or alias', async () => {
		await startRefresh(getDb(), okFetch).done;
		const before = (await run()).books.map((b: any) => b.title);

		replaceOwned(getDb(), [
			{ asin: 'B1', title: `${before[0]}: A Novel`, authors: [lastFirst((await run()).books[0].author)] },
			{ asin: 'B2', title: 'Some Desperate Glory', authors: ['Tesh, Emily'] }
		]);
		const after = (await run()).books.map((b: any) => b.title);

		expect(after).toHaveLength(10);
		expect(after).not.toContain(before[0]);
		expect(after).not.toContain('Q123300220');
		expect(after).not.toContain('Some Desperate Glory');
	});

	it('returns the error and keeps the books after a failed refresh', async () => {
		await startRefresh(getDb(), okFetch).done;
		await startRefresh(getDb(), failingFetch).done;
		const data = await run();

		expect(data.books).toHaveLength(10);
		expect(data.refresh).toMatchObject({ status: 'failed', error: 'network down' });
	});
});

function lastFirst(name: string) {
	const parts = name.split(' ');
	return `${parts.at(-1)}, ${parts.slice(0, -1).join(' ')}`;
}

function own(book: { source: string; sourceId: string }) {
	const form = new FormData();
	form.set('source', book.source);
	form.set('sourceId', book.sourceId);
	const request = new Request('http://localhost:3000/?/own', { method: 'POST', body: form });
	return actions.own({ request } as Parameters<typeof actions.own>[0]);
}

describe('"I own this"', () => {
	beforeEach(async () => {
		getDb().exec(
			'DELETE FROM work_alias; DELETE FROM award_entry; DELETE FROM work; DELETE FROM refresh_log; DELETE FROM source_cache; DELETE FROM owned; DELETE FROM owned_override;'
		);
		await startRefresh(getDb(), okFetch).done;
	});

	it('hides the book on the next load', async () => {
		const [first] = (await run()).books;
		await own(first);

		const titles = (await run()).books.map((b: any) => b.title);
		expect(titles).toHaveLength(10);
		expect(titles).not.toContain(first.title);
	});

	it('keeps the book hidden after a new Kindle import', async () => {
		const [first] = (await run()).books;
		await own(first);
		replaceOwned(getDb(), [{ asin: 'B9', title: 'Something else', authors: ['Other, Author'] }]);

		expect((await run()).books.map((b: any) => b.title)).not.toContain(first.title);
	});

	it('keeps the book hidden after a refresh', async () => {
		const [first] = (await run()).books;
		await own(first);
		await startRefresh(getDb(), okFetch).done;

		expect((await run()).books.map((b: any) => b.title)).not.toContain(first.title);
	});

	it('rejects a request with no book', async () => {
		const request = new Request('http://localhost:3000/?/own', { method: 'POST', body: new FormData() });
		const result = (await actions.own({ request } as Parameters<typeof actions.own>[0])) as any;
		expect(result.status).toBe(400);
	});
});

describe('series entries', () => {
	beforeEach(async () => {
		getDb().exec(
			'DELETE FROM series_entry; DELETE FROM series; DELETE FROM work_alias; DELETE FROM award_entry; DELETE FROM work; DELETE FROM refresh_log; DELETE FROM source_cache; DELETE FROM owned; DELETE FROM owned_override;'
		);
		await startRefresh(getDb(), okFetch).done;
	});

	const lockedTomb = () => listAwardBooks(getDb(), Infinity).find((b) => b.series?.name === 'Locked Tomb series');

	it('shows book 1 for a series where only a later book was awarded and I own none', () => {
		expect(lockedTomb()).toMatchObject({ title: 'Gideon the Ninth', series: { position: 1 } });
		expect(new Set(lockedTomb()!.awards.map((a) => a.bookTitle))).toEqual(new Set(['Nona the Ninth']));
	});

	it('moves the series entry on to the next book when I press I own this', async () => {
		await own(lockedTomb()!);
		expect(lockedTomb()).toMatchObject({ title: 'Harrow the Ninth', series: { position: 2 } });
	});
});
