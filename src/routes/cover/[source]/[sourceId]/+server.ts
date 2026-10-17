import { getDb } from '#lib/server/db.js';
import { coverUrl, findCover, placeholderSvg } from '#lib/server/covers.js';
import type { RequestHandler } from './$types';

const DAY = 24 * 60 * 60;

/** Redirects to the Open Library cover, or serves a placeholder when there is none. */
export const GET: RequestHandler = async ({ params, url }) => {
	let coverId: number | null | undefined = null;
	let maxAge = 30 * DAY;
	try {
		coverId = await findCover(getDb(), params.source, params.sourceId);
	} catch {
		// Open Library is down: show the placeholder for now and try again later.
		maxAge = 60 * 60;
	}
	if (coverId) {
		return new Response(null, {
			status: 302,
			headers: { location: coverUrl(coverId), 'cache-control': `private, max-age=${maxAge}` }
		});
	}
	return new Response(placeholderSvg(url.searchParams.get('title') ?? ''), {
		headers: { 'content-type': 'image/svg+xml', 'cache-control': `private, max-age=${maxAge}` }
	});
};
