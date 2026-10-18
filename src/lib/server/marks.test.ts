import { beforeEach, describe, expect, it } from 'vitest';
import { openDb, type Db } from './db';
import { markBook, marksBySource } from './marks';

describe('markBook', () => {
	let db: Db;
	beforeEach(() => {
		db = openDb(':memory:');
	});

	it('keeps only the latest mark for a book', () => {
		markBook(db, 'wikidata', 'Q1', 'queued');
		markBook(db, 'wikidata', 'Q1', 'read');

		expect(db.prepare('SELECT mark FROM book_mark').pluck().all()).toEqual(['read']);
		expect(marksBySource(db).get('wikidata|Q1')).toBe('read');
	});

	it('keeps marks separate per user', () => {
		markBook(db, 'wikidata', 'Q1', 'queued', '1');
		markBook(db, 'wikidata', 'Q1', 'rejected', '2');

		expect(marksBySource(db, '1').get('wikidata|Q1')).toBe('queued');
		expect(marksBySource(db, '2').get('wikidata|Q1')).toBe('rejected');
	});

	it('rejects an unknown mark', () => {
		expect(() => markBook(db, 'wikidata', 'Q1', 'loved' as never)).toThrow();
	});
});
