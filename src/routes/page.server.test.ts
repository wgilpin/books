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

const run = (search = '') =>
	load({ url: new URL(`http://localhost:3000/${search}`) } as Parameters<typeof load>[0]) as Promise<Record<string, any>>;

describe('/ load', () => {
	beforeEach(() => {
		resetDb();
	});

	it('returns no books and no refresh on an empty database', async () => {
		expect(await run()).toEqual({ books: [], refresh: null, genre: null, includeUnknown: true, limit: 10, hasMore: false });
	});

	it('returns the ten newest award books, newest award year first, each with entries and Kindle link', async () => {
		await startRefresh(getDb(), okFetch).done;
		const { books } = await run();

		expect(books).toHaveLength(10);
		const years = books.map((b: any) => Math.max(...b.awards.map((a: any) => a.year)));
		expect(years).toEqual([...years].sort((a, b) => b - a));
		expect(years.every((y: number) => y === 2024)).toBe(true);
		const counts = books.map((b: any) => b.awards.length);
		expect(counts).toEqual([...counts].sort((a, b) => b - a));
		expect(books[0].awards.length).toBeGreaterThan(1);
		expect(books[0]).toEqual({
			source: 'wikidata',
			sourceId: expect.stringMatching(/^Q\d+$/),
			title: expect.any(String),
			author: expect.any(String),
			kindleUrl: expect.stringMatching(/^https:\/\/www\.amazon\.co\.uk\/s\?k=.+&i=digital-text$/),
			awards: expect.arrayContaining([expect.objectContaining({ year: 2024 })]),
			series: null,
			genre: { sf: expect.any(Boolean), fantasy: expect.any(Boolean) },
			awardBooks: [{ source: 'wikidata', sourceId: expect.stringMatching(/^Q\d+$/) }]
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

function mark(book: { source: string; sourceId: string }, value: string) {
	const form = new FormData();
	form.set('source', book.source);
	form.set('sourceId', book.sourceId);
	form.set('mark', value);
	const request = new Request('http://localhost:3000/?/mark', { method: 'POST', body: form });
	return actions.mark({ request } as Parameters<typeof actions.mark>[0]) as Promise<any>;
}

const own = (book: { source: string; sourceId: string }) => mark(book, 'owned');

describe('"I own this"', () => {
	beforeEach(async () => {
		resetDb();
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
		const request = new Request('http://localhost:3000/?/mark', { method: 'POST', body: new FormData() });
		const result = (await actions.mark({ request } as Parameters<typeof actions.mark>[0])) as any;
		expect(result.status).toBe(400);
	});
});

describe('series entries', () => {
	beforeEach(async () => {
		resetDb();
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

describe('genre filter', () => {
	beforeEach(async () => {
		resetDb();
		await startRefresh(getDb(), okFetch).done;
	});

	it('lists science fiction and unknown entries for ?genre=sf', async () => {
		const data = await run('?genre=sf');
		expect(data.genre).toBe('sf');
		expect(data.books).toHaveLength(10);
		expect(data.books.every((b: any) => b.genre.sf || !b.genre.fantasy)).toBe(true);
	});

	it('lists fantasy and unknown entries for ?genre=fantasy', async () => {
		const data = await run('?genre=fantasy');
		expect(data.genre).toBe('fantasy');
		expect(data.books.length).toBeGreaterThan(0);
		expect(data.books.every((b: any) => b.genre.fantasy || !b.genre.sf)).toBe(true);
	});

	it('shows All for an unrecognised genre', async () => {
		const data = await run('?genre=xyz');
		expect(data.genre).toBeNull();
		expect(data.books.map((b: any) => b.title)).toEqual((await run()).books.map((b: any) => b.title));
	});
});

function resetDb() {
	getDb().exec(
		'DELETE FROM book_mark; DELETE FROM work_genre; DELETE FROM series_entry; DELETE FROM series; DELETE FROM work_alias; DELETE FROM award_entry; DELETE FROM work; DELETE FROM refresh_log; DELETE FROM source_cache; DELETE FROM owned;'
	);
}

describe('Read and Reject', () => {
	beforeEach(async () => {
		resetDb();
		await startRefresh(getDb(), okFetch).done;
	});

	const lockedTomb = () => listAwardBooks(getDb(), Infinity).find((b) => b.series?.name === 'Locked Tomb series');

	it('moves a series entry on when I mark its book read', async () => {
		await mark(lockedTomb()!, 'read');
		expect(lockedTomb()).toMatchObject({ title: 'Harrow the Ninth' });
	});

	it('drops the whole series when I reject its entry, and it stays gone after an import and a refresh', async () => {
		await mark(lockedTomb()!, 'rejected');
		replaceOwned(getDb(), [{ asin: 'B9', title: 'Other', authors: ['Other, Author'] }]);
		await startRefresh(getDb(), okFetch).done;
		expect(lockedTomb()).toBeUndefined();
	});

	it('removes a rejected standalone book for good', async () => {
		const [first] = (await run()).books;
		await mark(first, 'rejected');
		await startRefresh(getDb(), okFetch).done;
		expect((await run()).books.map((b: any) => b.title)).not.toContain(first.title);
	});

	it('fails with 400 and saves nothing for an unknown mark', async () => {
		const [first] = (await run()).books;
		const result = await mark(first, 'loved');
		expect(result.status).toBe(400);
		expect(getDb().prepare('SELECT COUNT(*) FROM book_mark').pluck().get()).toBe(0);
	});
});

describe('genre override and include unknown', () => {
	beforeEach(async () => {
		resetDb();
		getDb().exec('DELETE FROM genre_override;');
		await startRefresh(getDb(), okFetch).done;
	});

	function setGenreVia(keys: { source: string; sourceId: string }[], value: string) {
		const form = new FormData();
		for (const key of keys) form.append('work', `${key.source}|${key.sourceId}`);
		form.set('genre', value);
		const request = new Request('http://localhost:3000/?/genre', { method: 'POST', body: form });
		return actions.genre({ request } as Parameters<typeof actions.genre>[0]) as Promise<any>;
	}

	it('leaves a book set to science fiction out of the fantasy filter', async () => {
		const unknown = listAwardBooks(getDb(), Infinity).find((b) => !b.genre.sf && !b.genre.fantasy)!;
		await setGenreVia(unknown.awardBooks, 'sf');
		const fantasy = listAwardBooks(getDb(), Infinity, { genre: 'fantasy' }).map((b) => b.title);
		expect(fantasy).not.toContain(unknown.title);
	});

	it('fails with 400 and saves nothing for an unknown genre value', async () => {
		const unknown = listAwardBooks(getDb(), Infinity).find((b) => !b.genre.sf && !b.genre.fantasy)!;
		const result = await setGenreVia(unknown.awardBooks, 'horror');
		expect(result.status).toBe(400);
		expect(getDb().prepare('SELECT COUNT(*) FROM genre_override').pluck().get()).toBe(0);
	});

	it('leaves out unknown-genre books for ?unknown=0, still listing ten', async () => {
		const data = await run('?unknown=0');
		expect(data.includeUnknown).toBe(false);
		expect(data.books).toHaveLength(10);
		expect(data.books.every((b: any) => b.genre.sf || b.genre.fantasy)).toBe(true);
	});

	it('includes unknown-genre books with no unknown parameter', async () => {
		const data = await run();
		expect(data.includeUnknown).toBe(true);
		expect(data.books.some((b: any) => !b.genre.sf && !b.genre.fantasy)).toBe(true);
	});
});

describe('show more', () => {
	beforeEach(async () => {
		resetDb();
		await startRefresh(getDb(), okFetch).done;
	});

	it('lists ten and says more are left by default', async () => {
		const data = await run();
		expect(data.books).toHaveLength(10);
		expect(data).toMatchObject({ limit: 10, hasMore: true });
	});

	it('lists twenty for ?limit=20, the first ten unchanged', async () => {
		const ten = (await run()).books.map((b: any) => b.title);
		const data = await run('?limit=20');
		expect(data.books).toHaveLength(20);
		expect(data.books.slice(0, 10).map((b: any) => b.title)).toEqual(ten);
	});

	it('says no more are left when the list holds every entry', async () => {
		const data = await run('?limit=200');
		expect(data.books.length).toBeLessThan(200);
		expect(data.hasMore).toBe(false);
	});

	it('uses ten for a limit that is not a positive number, and caps it at 200', async () => {
		expect((await run('?limit=abc')).limit).toBe(10);
		expect((await run('?limit=-5')).limit).toBe(10);
		expect((await run('?limit=5000')).limit).toBe(200);
	});
});

describe('user isolation', () => {
	beforeEach(async () => {
		resetDb();
		await startRefresh(getDb(), okFetch).done;
	});

	const runAs = (user: '1' | '2', search = '') =>
		load({ url: new URL(`http://localhost:3000/${search}`), locals: { user } } as unknown as Parameters<typeof load>[0]) as Promise<
			Record<string, any>
		>;

	function markAs(user: '1' | '2', book: { source: string; sourceId: string }, value: string) {
		const form = new FormData();
		form.set('source', book.source);
		form.set('sourceId', book.sourceId);
		form.set('mark', value);
		const request = new Request('http://localhost:3000/?/mark', { method: 'POST', body: form });
		return actions.mark({ request, locals: { user } } as unknown as Parameters<typeof actions.mark>[0]) as Promise<any>;
	}

	it('isolates owned books, marks and series progress between user 1 and user 2', async () => {
		const [first] = (await runAs('1')).books;
		replaceOwned(getDb(), [{ asin: 'B1', title: first.title, authors: [lastFirst(first.author)] }], '1');

		const gideon = (await runAs('1', '?limit=200')).books.find((b: any) => b.series?.name === 'Locked Tomb series')!;
		await markAs('1', gideon, 'read');

		// User 1 no longer sees `first`, and Locked Tomb advances to book 2.
		const user1Books = (await runAs('1', '?limit=200')).books;
		expect(user1Books.map((b: any) => b.title)).not.toContain(first.title);
		expect(user1Books.find((b: any) => b.series?.name === 'Locked Tomb series')).toMatchObject({
			title: 'Harrow the Ninth',
			series: { position: 2 }
		});

		// User 2 still sees `first` and book 1 of Locked Tomb.
		const user2Books = (await runAs('2', '?limit=200')).books;
		expect(user2Books.map((b: any) => b.title)).toContain(first.title);
		expect(user2Books.find((b: any) => b.series?.name === 'Locked Tomb series')).toMatchObject({
			title: 'Gideon the Ninth',
			series: { position: 1 }
		});

		// User 2 rejecting Locked Tomb drops it for user 2 only.
		await markAs('2', gideon, 'rejected');
		expect((await runAs('2', '?limit=200')).books.find((b: any) => b.series?.name === 'Locked Tomb series')).toBeUndefined();
		expect((await runAs('1', '?limit=200')).books.find((b: any) => b.series?.name === 'Locked Tomb series')).toMatchObject({
			title: 'Harrow the Ninth'
		});
	});
});
