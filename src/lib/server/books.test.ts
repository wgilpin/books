import { beforeEach, describe, expect, it } from 'vitest';
import { fakeWikidata } from '../../../tests/fake-wikidata';
import { listAwardBooks } from './books';
import { openDb, type Db } from './db';
import { replaceOwned } from './owned';
import { startRefresh } from './refresh';

// Wikidata is the edge of the system, so tests replace fetch. Nothing calls the real service.
const okFetch = fakeWikidata();

describe('listAwardBooks', () => {
	let db: Db;
	beforeEach(async () => {
		db = openDb(':memory:');
		await startRefresh(db, okFetch).done;
	});

	it('returns every award book when no limit is given and nothing is owned', () => {
		expect(listAwardBooks(db, Infinity)).toHaveLength(36);
	});

	it('hides a book owned under a store title with "Last, First" author', () => {
		replaceOwned(db, [{ asin: 'B1', title: 'Venomous Lumpsucker: A Novel', authors: ['Beauman, Ned'] }]);
		const titles = listAwardBooks(db, Infinity).map((b) => b.title);
		expect(titles).toHaveLength(35);
		expect(titles).not.toContain('Venomous Lumpsucker');
	});

	it('hides a book owned under a Wikidata alias', () => {
		replaceOwned(db, [{ asin: 'B2', title: 'Some Desperate Glory', authors: ['Tesh, Emily'] }]);
		expect(listAwardBooks(db, Infinity).map((b) => b.title)).not.toContain('Q123300220');
	});

	it('keeps a book with the same title by a different author', () => {
		replaceOwned(db, [{ asin: 'B3', title: 'Venomous Lumpsucker', authors: ['Someone, Else'] }]);
		expect(listAwardBooks(db, Infinity).map((b) => b.title)).toContain('Venomous Lumpsucker');
	});

	it('cuts the list to the limit after it removes owned books', () => {
		const first = listAwardBooks(db, 10);
		replaceOwned(db, [{ asin: 'B4', title: first[0].title, authors: [first[0].author] }]);
		const next = listAwardBooks(db, 10);
		expect(next).toHaveLength(10);
		expect(next.map((b) => b.title)).not.toContain(first[0].title);
		expect(next.slice(0, 9)).toEqual(first.slice(1));
	});
});
