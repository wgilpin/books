import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseAwardNovels } from './wikidata';

const fixture = readFileSync('tests/fixtures/wikidata-award-novels.json', 'utf8');

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
