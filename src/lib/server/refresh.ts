import type { Db } from './db';
import {
	fetchAliases,
	fetchAwardNovels,
	fetchSeriesIds,
	fetchSeriesMembers,
	parseAliases,
	parseAwardNovels,
	parseSeriesIds,
	parseSeriesMembers,
	SOURCE
} from './sources/wikidata';
import type { AliasRecord, SeriesMemberRecord, SourceRecords } from './sources/types';

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
			const seriesIdsBody = await fetchSeriesIds(fetchFn);
			const seriesIds = parseSeriesIds(seriesIdsBody);
			const seriesBody = seriesIds.length ? await fetchSeriesMembers(seriesIds, fetchFn) : '{"results":{"bindings":[]}}';
			const records = parseAwardNovels(body);
			const aliases = parseAliases(aliasBody);
			const members = parseSeriesMembers(seriesBody);
			const cache = db.prepare("INSERT INTO source_cache (source, query, fetched_at, body) VALUES (?, ?, datetime('now'), ?)");
			db.transaction(() => {
				cache.run(SOURCE, 'award-novels', body);
				cache.run(SOURCE, 'aliases', aliasBody);
				cache.run(SOURCE, 'series-ids', seriesIdsBody);
				cache.run(SOURCE, 'series-members', seriesBody);
				store(db, records);
				storeAliases(db, aliases);
				storeSeries(db, members);
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

/** Upserts series and member works, then replaces this source's series entries. */
function storeSeries(db: Db, members: SeriesMemberRecord[]) {
	const upsertWork = db.prepare(`
		INSERT INTO work (source, source_id, title, author) VALUES (@source, @sourceId, @title, @author)
		ON CONFLICT (source, source_id) DO UPDATE SET title = excluded.title, author = excluded.author`);
	const upsertSeries = db.prepare(`
		INSERT INTO series (source, source_id, name) VALUES (?, ?, ?)
		ON CONFLICT (source, source_id) DO UPDATE SET name = excluded.name`);
	const insertEntry = db.prepare(`
		INSERT OR REPLACE INTO series_entry (series_id, work_id, position)
		SELECT s.id, w.id, @position FROM series s, work w
		 WHERE s.source = @source AND s.source_id = @seriesSourceId
		   AND w.source = @source AND w.source_id = @workSourceId`);

	db.prepare('DELETE FROM series_entry WHERE series_id IN (SELECT id FROM series WHERE source = ?)').run(SOURCE);
	for (const member of members) {
		upsertSeries.run(member.source, member.seriesSourceId, member.seriesName);
		// A member that is also an award book keeps its award title and author.
		if (!db.prepare('SELECT 1 FROM work WHERE source = ? AND source_id = ?').get(member.work.source, member.work.sourceId)) {
			upsertWork.run(member.work);
		}
		insertEntry.run({
			source: member.source,
			seriesSourceId: member.seriesSourceId,
			workSourceId: member.work.sourceId,
			position: member.position
		});
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
