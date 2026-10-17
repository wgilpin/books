import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

const page = (data: object) => render(Page, { props: { data } as never }).body;

const book = {
	source: 'wikidata',
	sourceId: 'Q1',
	title: 'Gideon the Ninth',
	author: 'Tamsyn Muir',
	kindleUrl: 'https://www.amazon.co.uk/s?k=x&i=digital-text',
	series: { name: 'Locked Tomb series', position: 1 },
	awards: []
};

describe('/queue page', () => {
	it('says when nothing is queued', () => {
		expect(page({ books: [], queueCount: 0 })).toContain('Nothing queued');
	});

	it('shows each queued book with Kindle, I own this, Read and Reject, and no Queue button', () => {
		const body = page({ books: [book], queueCount: 1 });
		expect(body).toContain('Gideon the Ninth');
		expect(body).toContain('Book 1 of Locked Tomb series');
		expect(body).toMatch(/<a class="button button--primary[^"]*"[^>]*>Kindle/);
		for (const value of ['owned', 'read', 'rejected']) expect(body).toContain(`value="${value}"`);
		expect(body).not.toContain('value="queued"');
		expect(body).toContain('action="?/mark"');
	});
});
