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
		expect(body).toMatch(/<button[^>]*type="submit"[^>]*aria-label="Refresh from Wikidata"/);
	});

	it('shows each book with its awards and a Kindle link', () => {
		const body = page({ books: [book], refresh: { status: 'ok', finishedAt: '2026-10-02 21:00:00', error: null } });
		expect(body).toContain('Venomous Lumpsucker');
		expect(body).toContain('Ned Beauman');
		expect(body).toMatch(/<span class="badge badge--clarke badge--won"[^>]*>★ Clarke 2023<span class="sr-only">, won 2023<\/span><\/span>/);
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
			{ award: 'Nebula', year: 2024, result: 'shortlisted' },
			{ award: 'Locus SF', year: 2024, result: 'shortlisted' }
		]
	};
	const ok = { status: 'ok', finishedAt: '2026-10-02 21:00:00', error: null };

	it('shows a filled badge for a win and an outlined badge for a shortlisting, in the award class', () => {
		const body = page({ books: [twoAwards], refresh: ok });
		expect(body).toMatch(/<span class="badge badge--hugo badge--won"[^>]*>★ Hugo 2024</);
		expect(body).toMatch(/<span class="badge badge--nebula"[^>]*>Nebula 2024</);
		expect(body).toMatch(/<span class="badge badge--locus-sf"[^>]*>Locus SF 2024</);
	});

	it('folds repeats of one award into one badge with a count and a year range', () => {
		const repeats = {
			...book,
			awards: [
				{ award: 'Hugo', year: 2009, result: 'shortlisted' },
				{ award: 'Hugo', year: 2008, result: 'won' },
				{ award: 'Hugo', year: 2006, result: 'shortlisted' }
			]
		};
		const body = page({ books: [repeats], refresh: ok });
		expect(body.match(/class="badge /g)).toHaveLength(1);
		expect(body).toMatch(/title="Hugo: won 2008; shortlisted 2006, 2009">★ Hugo ×3 · 2006–2009</);
	});

	it('puts a cover, the title link, author, a primary Kindle link, icon buttons and a More menu in a card', () => {
		const body = page({ books: [book], refresh: ok });
		expect(body).toMatch(/<article class="card"/);
		expect(body).toMatch(/<img src="\/cover\/wikidata\/Q133510892\?title=Venomous%20Lumpsucker" alt="" loading="lazy"/);
		expect(body).toMatch(/<h2 class="card__title"><a [^>]*>Venomous Lumpsucker<\/a><\/h2>/);
		expect(body).toMatch(/<p class="card__author">Ned Beauman<\/p>/);
		expect(body).toMatch(/<a class="button button--primary[^"]*"[^>]*>Kindle/);
		expect(body).toMatch(/<button class="icon-button"[^>]*value="queued"/);
		expect(body).toMatch(/<button class="icon-button"[^>]*value="read"/);
		expect(body).toMatch(/<details class="menu"><summary [^>]*aria-label="More actions for Venomous Lumpsucker"/);
		expect(body).toMatch(/<button class="menu__item"[^>]*>I own this<\/button>/);
		expect(body).toMatch(/<button class="menu__item"[^>]*>Reject<\/button>/);
	});

	it('names the book in the I own this button and says the Kindle link opens a new tab', () => {
		const body = page({ books: [book], refresh: ok });
		expect(body).toMatch(/<button [^>]*aria-label="I own Venomous Lumpsucker"/);
		expect(body).toMatch(/<a class="button button--primary[^"]*"[^>]*target="_blank"[^>]*>Kindle<span class="sr-only"> \(opens in a new tab\)<\/span><\/a>/);
	});

	it('says I own every award book when a refresh succeeded and no book is left', () => {
		const body = page({ books: [], refresh: ok });
		expect(body).toContain('You own every award book in the list.');
		expect(body).not.toContain('No award data yet');
	});

	it('puts the last refresh in the header and uses a notice for an error', () => {
		const body = page({ books: [book], refresh: ok });
		expect(body).toMatch(/<header class="header"/);
		expect(body).toMatch(/<p class="header__meta">Last refreshed 2026-10-02 21:00:00<\/p>/);
		expect(body).not.toContain('class="notice"');
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
			/<button [^>]*name="mark"[^>]*value="queued"[^>]*aria-label="Queue Venomous Lumpsucker"[^>]*title="Queue"/
		);
	});

	it('links to the queue with its count in the header', () => {
		expect(page({ books: [book], refresh: null, genre: null, queueCount: 3 })).toMatch(/<a [^>]*href="\/queue"[^>]*>Queue <span class="count">3<\/span><\/a>/);
	});
});

describe('/ page genre override and include unknown', () => {
	const unknown = { ...book, genre: { sf: false, fantasy: false }, awardBooks: [{ source: 'wikidata', sourceId: 'Q133510892' }] };
	const known = { ...unknown, genre: { sf: true, fantasy: false } };

	it('offers Science fiction, Fantasy and Both on every card, with the current genre disabled (ISS-16)', () => {
		const body = page({ books: [unknown], refresh: null, genre: null, includeUnknown: true });
		expect(body).toContain('action="?/genre"');
		expect(body).toContain('name="work" value="wikidata|Q133510892"');
		for (const [value, label] of [['sf', 'Science fiction'], ['fantasy', 'Fantasy'], ['both', 'Both']]) {
			expect(body).toMatch(new RegExp(`<button [^>]*name="genre"[^>]*value="${value}"[^>]*aria-label="Set Venomous Lumpsucker as ${label}"`));
		}
		const knownBody = page({ books: [known], refresh: null, genre: null, includeUnknown: true });
		expect(knownBody).toContain('action="?/genre"');
		expect(knownBody).toMatch(/<button [^>]*name="genre"[^>]*value="sf"[^>]*disabled/);
		expect(knownBody).toMatch(/<button (?![^>]*disabled)[^>]*name="genre"[^>]*value="fantasy"/);
		expect(knownBody).toMatch(/<button (?![^>]*disabled)[^>]*name="genre"[^>]*value="both"/);
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

describe('/ page show more', () => {
	const many = Array.from({ length: 10 }, (_, i) => ({ ...book, sourceId: `Q${i}`, title: `Book ${i}` }));

	it('links to ten more, jumping to the first new card and keeping the filters', () => {
		const body = page({ books: many, refresh: null, genre: 'sf', includeUnknown: false, limit: 10, hasMore: true });
		expect(body).toMatch(/<a class="button button--secondary" href="\/\?genre=sf&amp;unknown=0&amp;limit=20#book-11">Show 10 more<\/a>/);
		expect(body).toContain('id="book-10"');
	});

	it('has no link when no more are left', () => {
		expect(page({ books: many, refresh: null, genre: null, includeUnknown: true, limit: 10, hasMore: false })).not.toContain('Show 10 more');
	});

	it('keeps the limit in the forms, so a mark does not shrink the list', () => {
		const body = page({ books: many, refresh: null, genre: null, includeUnknown: true, limit: 20, hasMore: true });
		expect(body).toContain('action="?limit=20&amp;/mark"');
	});
});
