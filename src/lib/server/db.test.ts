import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
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

describe('migration 007', () => {
	let dir: string | undefined;
	afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

	it('turns each old "I own this" override into an owned mark and drops the old table', () => {
		dir = mkdtempSync(join(tmpdir(), 'books-db-'));
		const path = join(dir, 'books.db');
		const db = openDb(path);
		// Put the database back to how it was before 007, with one override.
		db.exec("DROP TABLE book_mark; DELETE FROM schema_migrations WHERE name = '007_book_mark.sql';");
		db.exec("CREATE TABLE owned_override (source TEXT NOT NULL, source_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (source, source_id))");
		db.exec("INSERT INTO owned_override VALUES ('wikidata', 'Q42', '2026-10-02 21:00:00')");
		db.close();

		const migrated = openDb(path);
		expect(migrated.prepare('SELECT source, source_id, mark FROM book_mark').all()).toEqual([
			{ source: 'wikidata', source_id: 'Q42', mark: 'owned' }
		]);
		expect(migrated.prepare("SELECT name FROM sqlite_master WHERE name = 'owned_override'").get()).toBeUndefined();
		migrated.close();
		void Database;
	});
});
