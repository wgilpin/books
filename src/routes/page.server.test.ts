import { describe, expect, it } from 'vitest';
import { load } from './+page.server';

describe('/ load', () => {
	it('returns no books and no last refresh on an empty database', async () => {
		const data = await load({} as Parameters<typeof load>[0]);
		expect(data).toEqual({ books: [], lastRefresh: null });
	});
});
