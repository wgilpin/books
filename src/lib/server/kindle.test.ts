import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseKindleCsv } from './kindle';

const sample = readFileSync('tests/fixtures/kindle-sample.csv', 'utf8');

describe('parseKindleCsv', () => {
	it('reads each row as an ASIN, a title and its authors', () => {
		const books = parseKindleCsv(sample);
		expect(books).toHaveLength(5);
		expect(books[0]).toEqual({ asin: 'B000000001', title: 'Venomous Lumpsucker: A Novel', authors: ['Beauman, Ned'] });
	});

	it('splits several authors on a semicolon', () => {
		expect(parseKindleCsv(sample)[2].authors).toEqual(['Jordan, Robert', 'Sanderson, Brandon']);
	});

	it('keeps quotes and commas inside a quoted field', () => {
		expect(parseKindleCsv(sample)[1].title).toBe('The Fifth Season: The Broken Earth, Book 1, WINNER OF THE HUGO AWARD');
		expect(parseKindleCsv(sample)[4].title).toBe('A Book With "Quotes", and Commas');
	});

	it('rejects a file without the asin,title,author header', () => {
		expect(() => parseKindleCsv('ASIN,Title,Authors,ISBN-13\n"B1","x","y","z"')).toThrow(
			'Expected the header asin,title,author'
		);
	});

	it('reads Windows line endings and skips blank lines', () => {
		expect(parseKindleCsv('asin,title,author\r\n"B1","T","A, B"\r\n\r\n')).toEqual([
			{ asin: 'B1', title: 'T', authors: ['A, B'] }
		]);
	});
});
