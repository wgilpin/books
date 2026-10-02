import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type Db = Database.Database;

// Bundled at build time, so the container needs no migrations folder.
const migrations = Object.entries(
	import.meta.glob<string>('/migrations/*.sql', { query: '?raw', import: 'default', eager: true })
)
	.map(([file, sql]) => ({ name: file.split('/').pop()!, sql }))
	.sort((a, b) => a.name.localeCompare(b.name));

export function openDb(path: string): Db {
	if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
	const db = new Database(path);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	migrate(db);
	return db;
}

function migrate(db: Db) {
	db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
	const applied = new Set(db.prepare('SELECT name FROM schema_migrations').pluck().all() as string[]);
	const record = db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, datetime('now'))");
	for (const { name, sql } of migrations) {
		if (applied.has(name)) continue;
		db.transaction(() => {
			db.exec(sql);
			record.run(name);
		})();
	}
}

let db: Db | undefined;

/** The app's database. Tests set DATABASE_PATH to ':memory:' in vite.config.js. */
export function getDb(): Db {
	db ??= openDb(process.env.DATABASE_PATH ?? 'data/books.db');
	return db;
}
