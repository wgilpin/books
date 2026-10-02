import type { Db } from './db';
import type { KindleBook } from './kindle';

/** Replaces the owned list in one transaction. Returns the number of distinct books stored. */
export function replaceOwned(db: Db, books: KindleBook[]): number {
	const insert = db.prepare('INSERT OR REPLACE INTO owned (asin, title, authors) VALUES (?, ?, ?)');
	return db.transaction(() => {
		db.exec('DELETE FROM owned');
		for (const book of books) insert.run(book.asin, book.title, book.authors.join('; '));
		const count = db.prepare('SELECT COUNT(*) FROM owned').pluck().get() as number;
		db.prepare("INSERT INTO owned_import (imported_at, count) VALUES (datetime('now'), ?)").run(count);
		return count;
	})();
}

export function ownedSummary(db: Db): { count: number; importedAt: string | null } {
	const count = db.prepare('SELECT COUNT(*) FROM owned').pluck().get() as number;
	const importedAt =
		(db.prepare('SELECT imported_at FROM owned_import ORDER BY id DESC LIMIT 1').pluck().get() as string | undefined) ??
		null;
	return { count, importedAt };
}

/** Marks a work as owned for good. A second mark changes nothing. */
export function markOwned(db: Db, source: string, sourceId: string) {
	db.prepare(
		"INSERT OR IGNORE INTO owned_override (source, source_id, created_at) VALUES (?, ?, datetime('now'))"
	).run(source, sourceId);
}
