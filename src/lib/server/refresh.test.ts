import { beforeEach, describe, expect, it } from 'vitest';
import { fakeWikidata } from '../../../tests/fake-wikidata';
import { openDb, type Db } from './db';
import { latestRefresh, startRefresh } from './refresh';


// Wikidata is the edge of the system, so tests replace fetch. Nothing calls the real service.
const okFetch = fakeWikidata();
const failingFetch = (async () => new Response('busy', { status: 503, statusText: 'Service Unavailable' })) as typeof fetch;

const count = (db: Db, table: string) => db.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get();

describe('refresh', () => {
	let db: Db;
	beforeEach(() => {
		db = openDb(':memory:');
	});

	it('stores the award novels and records a finished refresh', async () => {
		await startRefresh(db, okFetch).done;

		expect(count(db, 'work')).toBe(42);
		expect(count(db, 'award_entry')).toBe(45);
		expect(count(db, 'source_cache')).toBe(4);
		expect(latestRefresh(db)).toMatchObject({ status: 'ok', error: null });
	});

	it('stores the aliases of award books and skips aliases of other books', async () => {
		await startRefresh(db, okFetch).done;
		await startRefresh(db, okFetch).done;

		expect(db.prepare('SELECT alias FROM work_alias ORDER BY alias').pluck().all()).toEqual([
			'Some Desperate Glory',
			'Venomous Lumpsucker (novel)'
		]);
	});

	it('stores each series with its numbered members as works', async () => {
		await startRefresh(db, okFetch).done;

		expect(count(db, 'series')).toBe(3);
		expect(count(db, 'series_entry')).toBe(8);
		expect(count(db, 'work')).toBe(42);
		const lockedTomb = db
			.prepare(
				`SELECT w.title, e.position FROM series s JOIN series_entry e ON e.series_id = s.id
				   JOIN work w ON w.id = e.work_id WHERE s.name = 'Locked Tomb series' ORDER BY e.position`
			)
			.all();
		expect(lockedTomb).toEqual([
			{ title: 'Gideon the Ninth', position: 1 },
			{ title: 'Harrow the Ninth', position: 2 },
			{ title: 'Nona the Ninth', position: 3 }
		]);
	});

	it('adds no duplicate series, entries or member works when it runs twice', async () => {
		await startRefresh(db, okFetch).done;
		await startRefresh(db, okFetch).done;

		expect(count(db, 'series')).toBe(3);
		expect(count(db, 'series_entry')).toBe(8);
		expect(count(db, 'work')).toBe(42);
	});

	it('adds no duplicates when it runs twice', async () => {
		await startRefresh(db, okFetch).done;
		const ids = db.prepare('SELECT id FROM work ORDER BY id').pluck().all();
		await startRefresh(db, okFetch).done;

		expect(count(db, 'work')).toBe(42);
		expect(count(db, 'award_entry')).toBe(45);
		expect(db.prepare('SELECT id FROM work ORDER BY id').pluck().all()).toEqual(ids);
	});

	it('keeps the old rows and records the error when the fetch fails', async () => {
		await startRefresh(db, okFetch).done;
		await startRefresh(db, failingFetch).done;

		expect(count(db, 'work')).toBe(42);
		expect(latestRefresh(db)).toMatchObject({
			status: 'failed',
			error: 'Wikidata returned 503 Service Unavailable'
		});
	});

	it('does not start a second refresh while one is running', async () => {
		let release!: () => void;
		const gate = new Promise<void>((resolve) => (release = resolve));
		const slowFetch = (async (url: string, init?: RequestInit) => {
			await gate;
			return okFetch(url, init);
		}) as typeof fetch;

		const first = startRefresh(db, slowFetch);
		const second = startRefresh(db, okFetch);

		expect(first.started).toBe(true);
		expect(second.started).toBe(false);
		expect(latestRefresh(db)).toMatchObject({ status: 'running' });
		release();
		await first.done;
		expect(count(db, 'refresh_log')).toBe(1);
	});
});
