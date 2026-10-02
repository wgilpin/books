import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

describe('/ page', () => {
	it('shows the empty state and a refresh button when there are no books', () => {
		const { body } = render(Page, { props: { data: { books: [], lastRefresh: null } } as never });
		expect(body).toContain('No award data yet');
		expect(body).toMatch(/<form[^>]*method="POST"[^>]*action="\?\/refresh"/);
		expect(body).toMatch(/<button[^>]*type="submit"[^>]*>Refresh from Wikidata<\/button>/);
	});
});
