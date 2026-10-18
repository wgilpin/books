import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

const page = (data: object, form: object | null = null) => render(Page, { props: { data, form } as never }).body;

describe('/import page', () => {
	it('shows the owned count, the import time and an upload form', () => {
		const body = page({ count: 2324, importedAt: '2026-10-02 21:30:00' });
		expect(body).toContain('2324 owned books, imported 2026-10-02 21:30:00.');
		expect(body).toMatch(/<form[^>]*method="POST"[^>]*enctype="multipart\/form-data"/);
		expect(body).toMatch(/<input[^>]*type="file"[^>]*name="file"/);
	});

	it('shows the result of an import or its error', () => {
		expect(page({ count: 5, importedAt: 'x' }, { imported: 5 })).toContain('Imported 5 books.');
		expect(page({ count: 5, importedAt: 'x' }, { error: 'Expected the header asin,title,author' })).toContain(
			'Import failed: Expected the header asin,title,author'
		);
	});
});

describe('/import page design', () => {
	it('uses the page header, a notice for the result and the styled file picker', () => {
		const body = page({ count: 5, importedAt: 'x' }, { imported: 5 });
		expect(body).toMatch(/<header class="header"/);
		expect(body).toMatch(/<p class="notice">Imported 5 books\.<\/p>/);
		expect(body).toMatch(/<label class="picker">/);
		expect(body).toMatch(/<button class="button button--primary" type="submit">Import<\/button>/);
		expect(page({ count: 5, importedAt: 'x' }, { error: 'bad' })).toMatch(/<p class="notice notice--error" role="alert">/);
	});
});

describe('/import page queue link', () => {
	it('links to the queue with its count', () => {
		expect(page({ count: 1, importedAt: 'x', queueCount: 2 })).toMatch(/<a [^>]*href="\/queue"[^>]*>Queue <span class="count">2<\/span><\/a>/);
	});
});

describe('/import instructions', () => {
	it('shows step-by-step instructions and the console script to export kindle_books.csv', () => {
		const body = page({ count: 0, importedAt: null });
		expect(body).toContain('https://read.amazon.co.uk/kindle-library');
		expect(body).toContain('asin,title,author');
		expect(body).toContain('kindle_books.csv');
	});
});
