import type { Db } from './db';

const SEARCH = 'https://openlibrary.org/search.json';

// Fixed by the user's global rule for web requests.
const USER_AGENT = 'OpenAI File Downloader, XaiImageApiFetch/1.0';

export const coverUrl = (coverId: number) => `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;

/** The Open Library search URL for a title and its first author. */
export function searchUrl(title: string, author: string) {
	const params = new URLSearchParams({ title, limit: '1', fields: 'cover_i' });
	const first = author.split(',')[0].trim();
	if (first) params.set('author', first);
	return `${SEARCH}?${params}`;
}

export function parseCoverId(body: string): number | null {
	const id = JSON.parse(body).docs?.[0]?.cover_i;
	return Number.isInteger(id) ? id : null;
}

/**
 * The cover id of a work: from the cache, or from one Open Library search that the cache then keeps.
 * Undefined for an unknown work. A failed search throws and caches nothing, so the next view tries again.
 */
export async function findCover(
	db: Db,
	source: string,
	sourceId: string,
	fetchFn: typeof fetch = fetch
): Promise<number | null | undefined> {
	const work = db
		.prepare(
			`SELECT w.id, w.title, w.author, c.work_id AS cached, c.cover_id AS coverId
			   FROM work w LEFT JOIN work_cover c ON c.work_id = w.id
			  WHERE w.source = ? AND w.source_id = ?`
		)
		.get(source, sourceId) as { id: number; title: string; author: string; cached: number | null; coverId: number | null } | undefined;
	if (!work) return undefined;
	if (work.cached !== null) return work.coverId;

	const response = await fetchFn(searchUrl(work.title, work.author), {
		headers: { Accept: 'application/json', 'User-Agent': USER_AGENT }
	});
	if (!response.ok) throw new Error(`Open Library returned ${response.status} ${response.statusText}`);
	const coverId = parseCoverId(await response.text());
	db.prepare("INSERT OR REPLACE INTO work_cover (work_id, cover_id, fetched_at) VALUES (?, ?, datetime('now'))").run(
		work.id,
		coverId
	);
	return coverId;
}

/** A plain book-shaped placeholder with the title's first letter. */
export function placeholderSvg(title: string) {
	const letter = (title.trim()[0] ?? '?').toUpperCase().replace(/[<&>"]/g, '');
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 120"><rect width="80" height="120" fill="#d9d4c7"/><rect x="6" width="2" height="120" fill="#c9c3b4"/><text x="44" y="70" font-family="Georgia, serif" font-size="36" fill="#6b6658" text-anchor="middle">${letter}</text></svg>`;
}
