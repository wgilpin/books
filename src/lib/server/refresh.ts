import type { Db } from './db';
import { fetchAliases, fetchAwardNovels, parseAliases, parseAwardNovels, SOURCE } from './sources/wikidata';
import type { AliasRecord, SourceRecords } from './sources/types';

export interface RefreshStatus {
	status: 'running' | 'ok' | 'failed';
	startedAt: string;
	finishedAt: string | null;
	error: string | null;
}

const running = new WeakSet<Db>();

/**
 * Starts a Wikidata refresh in the background. A second call while one runs does nothing.
 * `done` settles when the refresh ends; it never rejects, because failures go to refresh_log.
 */
export function startRefresh(db: Db, fetchFn: typeof fetch = fetch) {
	if (running.has(db)) return { started: false, done: Promise.resolve() };
	running.add(db);

	// A row left 'running' by a stopped process can never finish.
	db.prepare("UPDATE refresh_log SET status = 'failed', error = 'Interrupted' WHERE status = 'running'").run();
	const logId = db
		.prepare("INSERT INTO refresh_log (source, started_at, status) VALUES (?, datetime('now'), 'running')")
		.run(SOURCE).lastInsertRowid;
	const finish = db.prepare("UPDATE refresh_log SET status = ?, error = ?, finished_at = datetime('now') WHERE id = ?");

	const done = (async () => {
		try {
			const body = await fetchAwardNovels(fetchFn);
			const aliasBody = await fetchAliases(fetchFn);
			const records = parseAwardNovels(body);
			const aliases = parseAliases(aliasBody);
			const cache = db.prepare("INSERT INTO source_cache (source, query, fetched_at, body) VALUES (?, ?, datetime('now'), ?)");
			db.transaction(() => {
				cache.run(SOURCE, 'award-novels', body);
				cache.run(SOURCE, 'aliases', aliasBody);
				store(db, records);
				storeAliases(db, aliases);
			})();
			finish.run('ok', null, logId);
		} catch (error) {
			finish.run('failed', error instanceof Error ? error.message : String(error), logId);
		} finally {
			running.delete(db);
		}
	})();

	return { started: true, done };
}

function store(db: Db, { works, awards }: SourceRecords) {
	const upsertWork = db.prepare(`
		INSERT INTO work (source, source_id, title, author) VALUES (@source, @sourceId, @title, @author)
		ON CONFLICT (source, source_id) DO UPDATE SET title = excluded.title, author = excluded.author`);
	const workId = db.prepare('SELECT id FROM work WHERE source = ? AND source_id = ?').pluck();
	const upsertAward = db.prepare(`
		INSERT INTO award_entry (work_id, award, year, result, source, source_id)
		VALUES (@workId, @award, @year, @result, @source, @sourceId)
		ON CONFLICT (source, source_id) DO UPDATE SET result = excluded.result`);

	for (const work of works) upsertWork.run(work);
	for (const award of awards) {
		upsertAward.run({ ...award, workId: workId.get(award.source, award.workSourceId) });
	}
}

/** Replaces the aliases of this source's works. Aliases of books with no award row are skipped. */
function storeAliases(db: Db, aliases: AliasRecord[]) {
	db.prepare('DELETE FROM work_alias WHERE work_id IN (SELECT id FROM work WHERE source = ?)').run(SOURCE);
	const insert = db.prepare(`
		INSERT OR IGNORE INTO work_alias (work_id, alias)
		SELECT id, @alias FROM work WHERE source = @source AND source_id = @workSourceId`);
	for (const alias of aliases) insert.run(alias);
}

export function latestRefresh(db: Db): RefreshStatus | null {
	return (
		(db
			.prepare(
				'SELECT status, started_at AS startedAt, finished_at AS finishedAt, error FROM refresh_log ORDER BY id DESC LIMIT 1'
			)
			.get() as RefreshStatus | undefined) ?? null
	);
}
