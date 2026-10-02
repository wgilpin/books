import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb, type Db } from './db';
import { latestRefresh, startRefresh } from './refresh';

const fixture = readFileSync('tests/fixtures/wikidata-award-novels.json', 'utf8');

// Wikidata is the edge of the system, so tests replace fetch. Nothing calls the real service.
const okFetch = (async () => new Response(fixture, { status: 200 })) as typeof fetch;
const failingFetch = (async () => new Response('busy', { status: 503, statusText: 'Service Unavailable' })) as typeof fetch;

const count = (db: Db, table: string) => db.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get();

describe('refresh', () => {
	let db: Db;
	beforeEach(() => {
		db = openDb(':memory:');
	});

	it('stores the award novels and records a finished refresh', async () => {
		await startRefresh(db, okFetch).done;

		expect(count(db, 'work')).toBe(36);
		expect(count(db, 'award_entry')).toBe(45);
		expect(count(db, 'source_cache')).toBe(1);
		expect(latestRefresh(db)).toMatchObject({ status: 'ok', error: null });
	});

	it('adds no duplicates when it runs twice', async () => {
		await startRefresh(db, okFetch).done;
		const ids = db.prepare('SELECT id FROM work ORDER BY id').pluck().all();
		await startRefresh(db, okFetch).done;

		expect(count(db, 'work')).toBe(36);
		expect(count(db, 'award_entry')).toBe(45);
		expect(db.prepare('SELECT id FROM work ORDER BY id').pluck().all()).toEqual(ids);
	});

	it('keeps the old rows and records the error when the fetch fails', async () => {
		await startRefresh(db, okFetch).done;
		await startRefresh(db, failingFetch).done;

		expect(count(db, 'work')).toBe(36);
		expect(latestRefresh(db)).toMatchObject({
			status: 'failed',
			error: 'Wikidata returned 503 Service Unavailable'
		});
	});

	it('does not start a second refresh while one is running', async () => {
		let release!: () => void;
		const slowFetch = (async () => {
			await new Promise<void>((resolve) => (release = resolve));
			return new Response(fixture);
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
