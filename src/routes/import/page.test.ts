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
