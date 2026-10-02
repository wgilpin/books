import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	ALIASES_QUERY,
	AWARD_NOVELS_QUERY,
	GENRES_QUERY,
	parseGenres,
	parseAliases,
	parseAwardNovels,
	parseSeriesIds,
	parseSeriesMembers,
	SERIES_IDS_QUERY,
	seriesMembersQuery
} from './wikidata';

const fixture = readFileSync('tests/fixtures/wikidata-award-novels.json', 'utf8');
const aliasFixture = readFileSync('tests/fixtures/wikidata-aliases.json', 'utf8');
const seriesFixture = readFileSync('tests/fixtures/wikidata-series.json', 'utf8');
const genreFixture = readFileSync('tests/fixtures/wikidata-genres.json', 'utf8');

describe('parseAwardNovels', () => {
	const records = parseAwardNovels(fixture);

	it('returns one work per book, tagged with its Wikidata id', () => {
		expect(records.works).toHaveLength(36);
		expect(records.works).toContainEqual({
			source: 'wikidata',
			sourceId: 'Q133510892',
			title: 'Venomous Lumpsucker',
			author: 'Ned Beauman'
		});
	});

	it('drops the rows that record a nomination on the author, not the book', () => {
		expect(records.works.map((w) => w.title)).not.toContain('Ned Beauman');
	});

	it('returns award entries with award, year and result', () => {
		expect(records.awards).toHaveLength(45);
		expect(records.awards.filter((a) => a.result === 'won')).toHaveLength(8);
		expect(records.awards).toContainEqual({
			source: 'wikidata',
			sourceId: 'Q133510892|Clarke|2023',
			workSourceId: 'Q133510892',
			award: 'Clarke',
			year: 2023,
			result: 'won'
		});
	});

	it('shows the Wikidata id for a book with no English title', () => {
		expect(records.works.find((w) => w.sourceId === 'Q123300220')?.title).toBe('Q123300220');
	});

	it('skips an award row with no year', () => {
		expect(records.awards.every((a) => Number.isInteger(a.year))).toBe(true);
	});
});

describe('labels and aliases', () => {
	it('asks for English labels, then the language-neutral mul label (ISS-5)', () => {
		expect(AWARD_NOVELS_QUERY).toContain('wikibase:language "en,mul"');
	});

	it('asks for English and mul aliases of award books', () => {
		expect(ALIASES_QUERY).toContain('skos:altLabel');
		expect(ALIASES_QUERY).toContain('"en"');
		expect(ALIASES_QUERY).toContain('"mul"');
	});

	it('returns each alias with the Wikidata id of its book', () => {
		expect(parseAliases(aliasFixture)).toEqual([
			{ source: 'wikidata', workSourceId: 'Q133510892', alias: 'Venomous Lumpsucker (novel)' },
			{ source: 'wikidata', workSourceId: 'Q123300220', alias: 'Some Desperate Glory' },
			{ source: 'wikidata', workSourceId: 'Q999999999', alias: 'Not an award book' }
		]);
	});
});

describe('series', () => {
	it('asks for the series of award books', () => {
		expect(SERIES_IDS_QUERY).toContain('wdt:P179');
		expect(parseSeriesIds('{"results":{"bindings":[{"series":{"value":"http://www.wikidata.org/entity/Q1"}}]}}')).toEqual([
			'Q1'
		]);
	});

	it('asks for the numbered members of the given series, with en,mul labels', () => {
		const query = seriesMembersQuery(['Q1', 'Q2']);
		expect(query).toContain('VALUES ?series { wd:Q1 wd:Q2 }');
		expect(query).toContain('pq:P1545');
		expect(query).toContain('wikibase:language "en,mul"');
	});

	it('returns each numbered member with its series, title, author and position', () => {
		const members = parseSeriesMembers(seriesFixture);
		expect(members).toHaveLength(8);
		expect(members).toContainEqual({
			source: 'wikidata',
			seriesSourceId: expect.stringMatching(/^Q\d+$/),
			seriesName: 'Locked Tomb series',
			work: { source: 'wikidata', sourceId: expect.stringMatching(/^Q\d+$/), title: 'Harrow the Ninth', author: 'Tamsyn Muir' },
			position: 2
		});
	});

	it('skips a member whose number is not numeric', () => {
		const body = JSON.stringify({
			results: {
				bindings: [
					{
						series: { value: 'http://www.wikidata.org/entity/Q1' },
						seriesLabel: { value: 'S' },
						member: { value: 'http://www.wikidata.org/entity/Q2' },
						memberLabel: { value: 'Prequel' },
						authorLabel: { value: 'A' },
						ord: { value: 'prequel' }
					}
				]
			}
		});
		expect(parseSeriesMembers(body)).toEqual([]);
	});
});

describe('genres', () => {
	it('asks for the genre labels of award books, with en,mul labels', () => {
		expect(GENRES_QUERY).toContain('wdt:P136');
		expect(GENRES_QUERY).toContain('wikibase:language "en,mul"');
	});

	it('returns each genre label with the Wikidata id of its book', () => {
		const genres = parseGenres(genreFixture);
		expect(genres).toHaveLength(37);
		expect(genres).toContainEqual({ source: 'wikidata', workSourceId: 'Q123300220', label: 'science fiction' });
	});
});
