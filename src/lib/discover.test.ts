import { describe, expect, it } from 'vitest';
import { buildEntries, type AwardBookInput, type SeriesMemberInput } from './discover';

const work = (id: string, title: string, author = 'Ann Author') => ({ source: 'wikidata', sourceId: id, title, author, aliases: [] });
const UNKNOWN = { sf: false, fantasy: false };
const award = (
	w: ReturnType<typeof work>,
	year: number,
	result: 'won' | 'shortlisted' = 'shortlisted',
	name = 'Hugo',
	genre = UNKNOWN
): AwardBookInput => ({
	...w,
	awards: [{ award: name, year, result }],
	genre
});
const member = (series: string, w: ReturnType<typeof work>, position: number): SeriesMemberInput => ({
	seriesKey: series,
	seriesName: series,
	work: w,
	position
});

const b1 = work('Q1', 'One');
const b2 = work('Q2', 'Two');
const b3 = work('Q3', 'Three');
const b4 = work('Q4', 'Four');
const saga = [member('Saga', b1, 1), member('Saga', b2, 2), member('Saga', b3, 3), member('Saga', b4, 4)];
const ownsIds = (...ids: string[]) => (w: { sourceId: string }) => ids.includes(w.sourceId);

describe('buildEntries', () => {
	it('shows the book after the last one I own', () => {
		const [entry] = buildEntries({ awardBooks: [award(b3, 2024)], members: saga, owns: ownsIds('Q2') });
		expect(entry.title).toBe('Three');
		expect(entry.series).toEqual({ name: 'Saga', position: 3 });
	});

	it('moves past the last owned book even when an earlier one is not owned', () => {
		const [entry] = buildEntries({ awardBooks: [award(b2, 2024)], members: saga, owns: ownsIds('Q3') });
		expect(entry.title).toBe('Four');
	});

	it('shows the lowest-numbered book when I own none of the series', () => {
		const [entry] = buildEntries({ awardBooks: [award(b3, 2024)], members: saga, owns: ownsIds() });
		expect(entry.title).toBe('One');
		expect(entry.series).toEqual({ name: 'Saga', position: 1 });
	});

	it('drops a series when I own every numbered book', () => {
		expect(buildEntries({ awardBooks: [award(b3, 2024)], members: saga, owns: ownsIds('Q1', 'Q2', 'Q3', 'Q4') })).toEqual([]);
	});

	it('drops a series when I own the last book, even with gaps before it', () => {
		expect(buildEntries({ awardBooks: [award(b3, 2024)], members: saga, owns: ownsIds('Q4') })).toEqual([]);
	});

	it('gives one entry for two award books in one series, with both award books and their badges', () => {
		const entries = buildEntries({
			awardBooks: [award(b3, 2023, 'won'), award(b4, 2024, 'shortlisted', 'Nebula')],
			members: saga,
			owns: ownsIds('Q1')
		});
		expect(entries).toHaveLength(1);
		expect(entries[0].title).toBe('Two');
		expect(entries[0].awards).toEqual([
			{ award: 'Nebula', year: 2024, result: 'shortlisted', bookTitle: 'Four' },
			{ award: 'Hugo', year: 2023, result: 'won', bookTitle: 'Three' }
		]);
	});

	it('uses the series with fewer numbered members when a book is in two', () => {
		const universe = [member('Universe', b1, 1), member('Universe', b2, 2), member('Universe', b3, 3), member('Universe', b4, 4), member('Universe', work('Q5', 'Five'), 5)];
		const trilogy = [member('Trilogy', b3, 1), member('Trilogy', b4, 2)];
		const [entry] = buildEntries({ awardBooks: [award(b4, 2024)], members: [...universe, ...trilogy], owns: ownsIds() });
		expect(entry.series).toEqual({ name: 'Trilogy', position: 1 });
		expect(entry.title).toBe('Three');
	});

	it('shows an award book in no series as itself, and hides it when owned', () => {
		const lone = work('Q9', 'Lone');
		expect(buildEntries({ awardBooks: [award(lone, 2024)], members: saga, owns: ownsIds() })[0]).toMatchObject({
			title: 'Lone',
			series: null
		});
		expect(buildEntries({ awardBooks: [award(lone, 2024)], members: saga, owns: ownsIds('Q9') })).toEqual([]);
	});

	it('returns the limit, newest award year first, a series counting once', () => {
		const books = Array.from({ length: 11 }, (_, i) => award(work(`L${i}`, `Lone ${i}`), 2010 + i));
		const entries = buildEntries({
			awardBooks: [...books, award(b3, 2015), award(b4, 2016)],
			members: saga,
			owns: ownsIds(),
			limit: 10
		});
		expect(entries).toHaveLength(10);
		const years = entries.map((e) => Math.max(...e.awards.map((a) => a.year)));
		expect(years).toEqual([...years].sort((a, b) => b - a));
		expect(entries.filter((e) => e.series?.name === 'Saga')).toHaveLength(1);
	});
});

describe('buildEntries genre filter', () => {
	const SF = { sf: true, fantasy: false };
	const FANTASY = { sf: false, fantasy: true };
	const books = [
		award(work('S1', 'Space'), 2024, 'won', 'Hugo', SF),
		award(work('F1', 'Dragons'), 2024, 'won', 'Hugo', FANTASY),
		award(work('B1', 'Both'), 2024, 'won', 'Hugo', { sf: true, fantasy: true }),
		award(work('U1', 'Unknown'), 2024, 'won', 'Hugo', UNKNOWN)
	];
	const titles = (genre?: 'sf' | 'fantasy') =>
		buildEntries({ awardBooks: books, members: [], owns: ownsIds(), genre }).map((e) => e.title).sort();

	it('keeps science fiction and unknown entries for sf', () => {
		expect(titles('sf')).toEqual(['Both', 'Space', 'Unknown']);
	});

	it('keeps fantasy and unknown entries for fantasy', () => {
		expect(titles('fantasy')).toEqual(['Both', 'Dragons', 'Unknown']);
	});

	it('keeps every entry with no filter, each carrying its genre', () => {
		expect(titles()).toEqual(['Both', 'Dragons', 'Space', 'Unknown']);
		const unknown = buildEntries({ awardBooks: books, members: [], owns: ownsIds() }).find((e) => e.title === 'Unknown');
		expect(unknown!.genre).toEqual(UNKNOWN);
	});

	it('gives a series entry the genre of its award books, not of the next book', () => {
		const entries = buildEntries({
			awardBooks: [award(b3, 2024, 'won', 'Hugo', FANTASY)],
			members: saga,
			owns: ownsIds(),
			genre: 'fantasy'
		});
		expect(entries).toHaveLength(1);
		expect(entries[0]).toMatchObject({ title: 'One', genre: FANTASY });
		expect(buildEntries({ awardBooks: [award(b3, 2024, 'won', 'Hugo', FANTASY)], members: saga, owns: ownsIds(), genre: 'sf' })).toEqual([]);
	});
});
