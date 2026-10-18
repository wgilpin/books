import type { Db } from './db';
import type { KindleBook } from './kindle';
import type { UserId } from './session';

/** Replaces the user's owned list in one transaction. Returns the number of distinct books stored. */
export function replaceOwned(db: Db, books: KindleBook[], user: UserId = '1'): number {
	const insert = db.prepare('INSERT OR REPLACE INTO owned (user, asin, title, authors) VALUES (?, ?, ?, ?)');
	return db.transaction(() => {
		db.prepare('DELETE FROM owned WHERE user = ?').run(user);
		for (const book of books) insert.run(user, book.asin, book.title, book.authors.join('; '));
		const count = db.prepare('SELECT COUNT(*) FROM owned WHERE user = ?').pluck().get(user) as number;
		db.prepare("INSERT INTO owned_import (user, imported_at, count) VALUES (?, datetime('now'), ?)").run(user, count);
		return count;
	})();
}

export function ownedSummary(db: Db, user: UserId = '1'): { count: number; importedAt: string | null } {
	const count = db.prepare('SELECT COUNT(*) FROM owned WHERE user = ?').pluck().get(user) as number;
	const importedAt =
		(db.prepare('SELECT imported_at FROM owned_import WHERE user = ? ORDER BY id DESC LIMIT 1').pluck().get(user) as
			| string
			| undefined) ?? null;
	return { count, importedAt };
}
