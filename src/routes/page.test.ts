import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

const page = (data: object) => render(Page, { props: { data } as never }).body;

const book = {
	source: 'wikidata',
	sourceId: 'Q133510892',
	title: 'Venomous Lumpsucker',
	author: 'Ned Beauman',
	kindleUrl: 'https://www.amazon.co.uk/s?k=Venomous+Lumpsucker+Ned+Beauman&i=digital-text',
	awards: [{ award: 'Clarke', year: 2023, result: 'won' }]
};

describe('/ page', () => {
	it('shows the empty state and a refresh button when there are no books', () => {
		const body = page({ books: [], refresh: null });
		expect(body).toContain('No award data yet');
		expect(body).toMatch(/<form[^>]*method="POST"[^>]*action="\?\/refresh"/);
		expect(body).toMatch(/<button[^>]*type="submit"[^>]*>Refresh from Wikidata<\/button>/);
	});

	it('shows each book with its awards and a Kindle link', () => {
		const body = page({ books: [book], refresh: { status: 'ok', finishedAt: '2026-10-02 21:00:00', error: null } });
		expect(body).toContain('Venomous Lumpsucker');
		expect(body).toContain('Ned Beauman');
		expect(body).toContain('Clarke 2023 · won');
		expect(body).toContain(`href="${book.kindleUrl.replaceAll('&', '&amp;')}"`);
	});

	it('shows that a refresh is running and disables the button', () => {
		const body = page({ books: [book], refresh: { status: 'running', finishedAt: null, error: null } });
		expect(body).toContain('Refreshing from Wikidata');
		expect(body).toMatch(/<button[^>]*disabled/);
	});

	it('shows the error and the time of a failed refresh', () => {
		const body = page({
			books: [book],
			refresh: { status: 'failed', finishedAt: '2026-10-02 21:05:00', error: 'network down' }
		});
		expect(body).toContain('Refresh failed at 2026-10-02 21:05:00: network down');
		expect(body).toContain('Venomous Lumpsucker');
	});
});

describe('/ page "I own this"', () => {
	it('gives each entry a form that posts its source and id', () => {
		const body = page({ books: [book], refresh: null });
		expect(body).toMatch(/<form[^>]*method="POST"[^>]*action="\?\/mark"/);
		expect(body).toMatch(/<input[^>]*type="hidden"[^>]*name="source"[^>]*value="wikidata"/);
		expect(body).toMatch(/<input[^>]*type="hidden"[^>]*name="sourceId"[^>]*value="Q133510892"/);
		expect(body).toMatch(/<button[^>]*>I own this<\/button>/);
	});
});

describe('/ page design', () => {
	const twoAwards = {
		...book,
		awards: [
			{ award: 'Hugo', year: 2024, result: 'won' },
			{ award: 'Nebula', year: 2024, result: 'shortlisted' }
		]
	};
	const ok = { status: 'ok', finishedAt: '2026-10-02 21:00:00', error: null };

	it('shows a filled badge for a win and an outlined badge for a shortlisting, in the award class', () => {
		const body = page({ books: [twoAwards], refresh: ok });
		expect(body).toMatch(/<span class="badge badge--hugo badge--won"[^>]*>Hugo 2024 · won<\/span>/);
		expect(body).toMatch(/<span class="badge badge--nebula"[^>]*>Nebula 2024<\/span>/);
	});

	it('puts the title link, author, a primary Kindle link and a secondary I own this button in a card', () => {
		const body = page({ books: [book], refresh: ok });
		expect(body).toMatch(/<article class="card"/);
		expect(body).toMatch(/<h2 class="card__title"><a [^>]*>Venomous Lumpsucker<\/a><\/h2>/);
		expect(body).toMatch(/<p class="card__author">Ned Beauman<\/p>/);
		expect(body).toMatch(/<a class="button button--primary"[^>]*>Kindle/);
		expect(body).toMatch(/<button class="button button--secondary"[^>]*>I own this<\/button>/);
		expect(body).toMatch(/<button class="button button--secondary"[^>]*>Read<\/button>/);
		expect(body).toMatch(/<button class="button button--quiet"[^>]*>Reject<\/button>/);
	});

	it('names the book in the I own this button and says the Kindle link opens a new tab', () => {
		const body = page({ books: [book], refresh: ok });
		expect(body).toMatch(/<button [^>]*aria-label="I own Venomous Lumpsucker"/);
		expect(body).toMatch(/<a class="button button--primary"[^>]*target="_blank"[^>]*>Kindle<span class="sr-only"> \(opens in a new tab\)<\/span><\/a>/);
	});

	it('says I own every award book when a refresh succeeded and no book is left', () => {
		const body = page({ books: [], refresh: ok });
		expect(body).toContain('You own every award book in the list.');
		expect(body).not.toContain('No award data yet');
	});

	it('uses the page header and a notice for the refresh state', () => {
		const body = page({ books: [book], refresh: ok });
		expect(body).toMatch(/<header class="header"/);
		expect(body).toMatch(/<p class="notice">Last refreshed 2026-10-02 21:00:00\.<\/p>/);
		const failed = page({ books: [book], refresh: { status: 'failed', finishedAt: 'x', error: 'boom' } });
		expect(failed).toMatch(/<p class="notice notice--error" role="alert">/);
	});
});

describe('/ page series entry', () => {
	const entry = {
		source: 'wikidata',
		sourceId: 'Q1',
		title: 'Gideon the Ninth',
		author: 'Tamsyn Muir',
		kindleUrl: 'https://www.amazon.co.uk/s?k=x&i=digital-text',
		awards: [{ award: 'Hugo', year: 2023, result: 'shortlisted', bookTitle: 'Nona the Ninth' }],
		series: { name: 'Locked Tomb series', position: 1 }
	};

	it('says which book of which series it is', () => {
		expect(page({ books: [entry], refresh: null })).toMatch(/<p class="card__series">Book 1 of Locked Tomb series<\/p>/);
		expect(page({ books: [{ ...entry, series: { name: 'Murderbot', position: 4.5 } }], refresh: null })).toContain(
			'Book 4.5 of Murderbot'
		);
	});

	it('names the award book when the entry shows a different book', () => {
		expect(page({ books: [entry], refresh: null })).toMatch(/<p class="card__series">Award for Nona the Ninth<\/p>/);
	});

	it('does not repeat the title when the award book is the book shown', () => {
		const same = { ...entry, awards: [{ ...entry.awards[0], bookTitle: 'Gideon the Ninth' }] };
		expect(page({ books: [same], refresh: null })).not.toContain('Award for');
	});
});

describe('/ page genre filter', () => {
	const known = { ...book, genre: { sf: true, fantasy: false } };
	const unknown = { ...book, title: 'Mystery', genre: { sf: false, fantasy: false } };

	it('links All, Science fiction and Fantasy and marks the current one', () => {
		const body = page({ books: [known], refresh: null, genre: 'sf' });
		expect(body).toMatch(/<a href="\/"[^>]*>All<\/a>/);
		expect(body).toMatch(/<a href="\/\?genre=sf"[^>]*aria-current="page"[^>]*>Science fiction<\/a>/);
		expect(body).toMatch(/<a href="\/\?genre=fantasy"[^>]*>Fantasy<\/a>/);
		expect(body.match(/aria-current="page"/g)).toHaveLength(1);
	});

	it('tags an unknown-genre entry and not a known one', () => {
		const body = page({ books: [known, unknown], refresh: null, genre: null });
		expect(body.match(/genre unknown/g)).toHaveLength(1);
	});

	it('keeps the filter in the forms', () => {
		const body = page({ books: [known], refresh: null, genre: 'fantasy' });
		expect(body).toContain('action="?genre=fantasy&amp;/mark"');
		expect(body).toContain('action="?genre=fantasy&amp;/refresh"');
	});
});

describe('/ page marks', () => {
	it('posts each mark with the book title in its accessible name', () => {
		const body = page({ books: [book], refresh: null, genre: null });
		for (const [value, label] of [
			['owned', 'I own'],
			['read', 'I have read'],
			['rejected', 'Reject']
		]) {
			expect(body).toMatch(new RegExp(`<button [^>]*name="mark"[^>]*value="${value}"[^>]*aria-label="${label} Venomous Lumpsucker"`));
		}
	});
});

describe('/ page queue', () => {
	it('has a Queue button with the title in its accessible name', () => {
		expect(page({ books: [book], refresh: null, genre: null })).toMatch(
			/<button [^>]*name="mark"[^>]*value="queued"[^>]*aria-label="Queue Venomous Lumpsucker"[^>]*>Queue<\/button>/
		);
	});

	it('links to the queue with its count in the header', () => {
		expect(page({ books: [book], refresh: null, genre: null, queueCount: 3 })).toMatch(/<a [^>]*href="\/queue"[^>]*>Queue \(3\)<\/a>/);
	});
});

describe('/ page genre override and include unknown', () => {
	const unknown = { ...book, genre: { sf: false, fantasy: false }, awardBooks: [{ source: 'wikidata', sourceId: 'Q133510892' }] };
	const known = { ...unknown, genre: { sf: true, fantasy: false } };

	it('offers Science fiction, Fantasy and Both on an unknown-genre card only', () => {
		const body = page({ books: [unknown], refresh: null, genre: null, includeUnknown: true });
		expect(body).toContain('action="?/genre"');
		expect(body).toContain('name="work" value="wikidata|Q133510892"');
		for (const [value, label] of [['sf', 'Science fiction'], ['fantasy', 'Fantasy'], ['both', 'Both']]) {
			expect(body).toMatch(new RegExp(`<button [^>]*name="genre"[^>]*value="${value}"[^>]*aria-label="Set Venomous Lumpsucker as ${label}"`));
		}
		expect(page({ books: [known], refresh: null, genre: null, includeUnknown: true })).not.toContain('?/genre');
	});

	it('shows Include unknown as on by default, and the toggle keeps the genre', () => {
		const body = page({ books: [], refresh: null, genre: 'sf', includeUnknown: true });
		expect(body).toMatch(/<a href="\/\?genre=sf&amp;unknown=0" class="toggle toggle--on">Include unknown<span class="sr-only">, on<\/span><\/a>/);
	});

	it('keeps Include unknown off in the genre links and the forms', () => {
		const body = page({ books: [unknown], refresh: null, genre: 'fantasy', includeUnknown: false });
		expect(body).toMatch(/<a href="\/\?genre=fantasy" class="toggle">Include unknown<span class="sr-only">, off<\/span><\/a>/);
		expect(body).toContain('href="/?genre=sf&amp;unknown=0"');
		expect(body).toContain('href="/?unknown=0"');
		expect(body).toContain('action="?genre=fantasy&amp;unknown=0&amp;/mark"');
	});
});
