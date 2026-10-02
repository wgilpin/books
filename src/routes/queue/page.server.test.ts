import { beforeEach, describe, expect, it } from 'vitest';
import { fakeWikidata } from '../../../tests/fake-wikidata';
import { listAwardBooks } from '#lib/server/books.js';
import { getDb } from '#lib/server/db.js';
import { markBook } from '#lib/server/marks.js';
import { startRefresh } from '#lib/server/refresh.js';
import { actions, load } from './+page.server';

const okFetch = fakeWikidata();
const run = () => load({} as Parameters<typeof load>[0]) as Promise<any>;

describe('/queue', () => {
	beforeEach(async () => {
		getDb().exec(
			'DELETE FROM book_mark; DELETE FROM work_genre; DELETE FROM series_entry; DELETE FROM series; DELETE FROM work_alias; DELETE FROM award_entry; DELETE FROM work; DELETE FROM refresh_log; DELETE FROM source_cache; DELETE FROM owned;'
		);
		await startRefresh(getDb(), okFetch).done;
	});

	it('is empty when nothing is queued', async () => {
		expect(await run()).toEqual({ books: [] });
	});

	it('lists queued books newest first, with author, Kindle link and series line', async () => {
		const all = listAwardBooks(getDb(), Infinity);
		const gideon = all.find((b) => b.series?.name === 'Locked Tomb series')!;
		const lone = all.find((b) => !b.series)!;
		markBook(getDb(), gideon.source, gideon.sourceId, 'queued');
		markBook(getDb(), lone.source, lone.sourceId, 'queued');

		const { books } = await run();
		expect(books.map((b: any) => b.title)).toEqual([lone.title, 'Gideon the Ninth']);
		expect(books[1]).toMatchObject({
			author: 'Tamsyn Muir',
			kindleUrl: expect.stringContaining('Gideon+the+Ninth'),
			series: { name: 'Locked Tomb series', position: 1 }
		});
	});

	it('drops a book from the queue when I mark it read there', async () => {
		const [first] = listAwardBooks(getDb(), 1);
		markBook(getDb(), first.source, first.sourceId, 'queued');
		const form = new FormData();
		form.set('source', first.source);
		form.set('sourceId', first.sourceId);
		form.set('mark', 'read');
		await actions.mark({ request: new Request('http://localhost:3000/queue?/mark', { method: 'POST', body: form }) } as any);

		expect((await run()).books).toEqual([]);
	});
});
