import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getDb, openDb } from './db';

const tables = (db: ReturnType<typeof openDb>) =>
	db
		.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
		.pluck()
		.all();

describe('openDb', () => {
	let dir: string | undefined;
	afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

	it('creates a missing database file and applies every migration', () => {
		dir = mkdtempSync(join(tmpdir(), 'books-db-'));
		const path = join(dir, 'nested', 'books.db');

		const db = openDb(path);

		expect(existsSync(path)).toBe(true);
		expect(tables(db)).toEqual(
			expect.arrayContaining(['award_entry', 'refresh_log', 'schema_migrations', 'source_cache', 'work'])
		);
		db.close();
	});

	it('applies each migration once when opened twice', () => {
		dir = mkdtempSync(join(tmpdir(), 'books-db-'));
		const path = join(dir, 'books.db');

		openDb(path).close();
		const db = openDb(path);

		const applied = db.prepare('SELECT name FROM schema_migrations').pluck().all();
		expect(applied).toEqual([...new Set(applied)]);
		expect(applied.length).toBeGreaterThan(0);
		db.close();
	});
});

describe('getDb in tests', () => {
	it('uses an in-memory database, never the live file', () => {
		expect(getDb().name).toBe(':memory:');
		expect(tables(getDb())).toContain('work');
	});
});
