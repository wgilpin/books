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

describe('migration 009', () => {
	let dir: string | undefined;
	afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

	it('scopes owned, owned_import and book_mark by user, keeping existing rows under user 1', () => {
		dir = mkdtempSync(join(tmpdir(), 'books-db-'));
		const path = join(dir, 'books.db');
		const db = openDb(path);
		// Put the three tables back to their pre-009 shape with one row each.
		db.exec(
			"DROP TABLE owned; DROP TABLE owned_import; DROP TABLE book_mark; DELETE FROM schema_migrations WHERE name = '009_user_scope.sql';"
		);
		db.exec(
			'CREATE TABLE owned (id INTEGER PRIMARY KEY, asin TEXT NOT NULL UNIQUE, title TEXT NOT NULL, authors TEXT NOT NULL);'
		);
		db.exec('CREATE TABLE owned_import (id INTEGER PRIMARY KEY, imported_at TEXT NOT NULL, count INTEGER NOT NULL);');
		db.exec(
			"CREATE TABLE book_mark (source TEXT NOT NULL, source_id TEXT NOT NULL, mark TEXT NOT NULL CHECK (mark IN ('owned', 'read', 'rejected', 'queued')), marked_at TEXT NOT NULL, PRIMARY KEY (source, source_id));"
		);
		db.exec("INSERT INTO owned (asin, title, authors) VALUES ('B01', 'Ancillary Justice', 'Leckie, Ann')");
		db.exec("INSERT INTO owned_import (imported_at, count) VALUES ('2026-10-02 10:00:00', 1)");
		db.exec("INSERT INTO book_mark (source, source_id, mark, marked_at) VALUES ('wikidata', 'Q42', 'queued', '2026-10-02 11:00:00')");
		db.close();

		const migrated = openDb(path);
		expect(migrated.prepare('SELECT user, asin, title FROM owned').all()).toEqual([
			{ user: '1', asin: 'B01', title: 'Ancillary Justice' }
		]);
		expect(migrated.prepare('SELECT user, count FROM owned_import').all()).toEqual([{ user: '1', count: 1 }]);
		expect(migrated.prepare('SELECT user, source, source_id, mark FROM book_mark').all()).toEqual([
			{ user: '1', source: 'wikidata', source_id: 'Q42', mark: 'queued' }
		]);

		// User 2 can store the same ASIN and the same work without conflict.
		migrated.exec("INSERT INTO owned (user, asin, title, authors) VALUES ('2', 'B01', 'Ancillary Justice', 'Leckie, Ann')");
		migrated.exec(
			"INSERT INTO book_mark (user, source, source_id, mark, marked_at) VALUES ('2', 'wikidata', 'Q42', 'read', '2026-10-18 12:00:00')"
		);
		expect(migrated.prepare('SELECT user, mark FROM book_mark ORDER BY user').all()).toEqual([
			{ user: '1', mark: 'queued' },
			{ user: '2', mark: 'read' }
		]);
		migrated.close();
	});
});
