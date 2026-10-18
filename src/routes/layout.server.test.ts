import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '#lib/server/db.js';
import { markBook } from '#lib/server/marks.js';
import { load } from './+layout.server';

describe('+layout.server load', () => {
	beforeEach(() => {
		getDb().exec('DELETE FROM book_mark;');
	});

	it('returns queueCount 0 when locals.user is absent on /login (ISS-15)', async () => {
		markBook(getDb(), 'wikidata', 'Q1', 'queued');

		expect(await load({ locals: {} } as Parameters<typeof load>[0])).toEqual({ queueCount: 0 });
	});

	it('returns the queueCount for the logged-in user only', async () => {
		markBook(getDb(), 'wikidata', 'Q1', 'queued', '1');
		markBook(getDb(), 'wikidata', 'Q2', 'queued', '1');
		markBook(getDb(), 'wikidata', 'Q3', 'queued', '2');

		expect(await load({ locals: { user: '1' } } as Parameters<typeof load>[0])).toEqual({ queueCount: 2 });
		expect(await load({ locals: { user: '2' } } as Parameters<typeof load>[0])).toEqual({ queueCount: 1 });
	});
});
