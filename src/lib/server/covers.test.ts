import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openDb, type Db } from './db';
import { findCover, parseCoverId, placeholderSvg, searchUrl } from './covers';

const ok = (body: object) => new Response(JSON.stringify(body), { status: 200 });

describe('findCover', () => {
	let db: Db;
	beforeEach(() => {
		db = openDb(':memory:');
		db.prepare("INSERT INTO work (source, source_id, title, author) VALUES ('wikidata', 'Q1', 'Machine', 'Elizabeth Bear, Someone Else')").run();
	});

	it('searches Open Library by title and first author, then caches the cover id', async () => {
		const fetchFn = vi.fn(async () => ok({ docs: [{ cover_i: 42 }] }));
		expect(await findCover(db, 'wikidata', 'Q1', fetchFn as never)).toBe(42);
		expect(await findCover(db, 'wikidata', 'Q1', fetchFn as never)).toBe(42);
		expect(fetchFn).toHaveBeenCalledTimes(1);
		const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe(searchUrl('Machine', 'Elizabeth Bear'));
		expect((init.headers as Record<string, string>)['User-Agent']).toBe('OpenAI File Downloader, XaiImageApiFetch/1.0');
	});

	it('caches a miss so it does not search again', async () => {
		const fetchFn = vi.fn(async () => ok({ docs: [] }));
		expect(await findCover(db, 'wikidata', 'Q1', fetchFn as never)).toBeNull();
		expect(await findCover(db, 'wikidata', 'Q1', fetchFn as never)).toBeNull();
		expect(fetchFn).toHaveBeenCalledTimes(1);
	});

	it('caches nothing when the search fails', async () => {
		const failing = vi.fn(async () => new Response('', { status: 503 }));
		await expect(findCover(db, 'wikidata', 'Q1', failing as never)).rejects.toThrow('503');
		expect(db.prepare('SELECT COUNT(*) FROM work_cover').pluck().get()).toBe(0);
	});

	it('returns undefined for an unknown work without a search', async () => {
		const fetchFn = vi.fn();
		expect(await findCover(db, 'wikidata', 'Q404', fetchFn as never)).toBeUndefined();
		expect(fetchFn).not.toHaveBeenCalled();
	});
});

describe('cover helpers', () => {
	it('reads only an integer cover id', () => {
		expect(parseCoverId('{"docs":[{"cover_i":7}]}')).toBe(7);
		expect(parseCoverId('{"docs":[{}]}')).toBeNull();
		expect(parseCoverId('{}')).toBeNull();
	});

	it('draws the first letter and escapes markup', () => {
		expect(placeholderSvg('machine')).toContain('>M</text>');
		expect(placeholderSvg('<b>')).not.toContain('<b>');
	});
});
