export interface KindleBook {
	asin: string;
	title: string;
	authors: string[];
}

const HEADER = ['asin', 'title', 'author'];

/** Parses the CSV from scripts/kindle-export.js. Throws on any other file. */
export function parseKindleCsv(text: string): KindleBook[] {
	const [header, ...rows] = parseCsv(text.replace(/^﻿/, ''));
	if (!header || header.join(',') !== HEADER.join(',')) {
		throw new Error(`Expected the header ${HEADER.join(',')}`);
	}
	return rows
		.filter((row) => row.some((field) => field.trim()))
		.map(([asin = '', title = '', author = '']) => ({
			asin: asin.trim(),
			title: title.trim(),
			authors: author
				.split(';')
				.map((name) => name.trim())
				.filter(Boolean)
		}))
		.filter((book) => book.asin && book.title);
}

/** RFC 4180 CSV: quoted fields may hold commas, doubled quotes and line breaks. */
function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (quoted) {
			if (char === '"' && text[i + 1] === '"') {
				field += '"';
				i++;
			} else if (char === '"') {
				quoted = false;
			} else {
				field += char;
			}
		} else if (char === '"') {
			quoted = true;
		} else if (char === ',') {
			row.push(field);
			field = '';
		} else if (char === '\n' || char === '\r') {
			if (char === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else {
			field += char;
		}
	}
	if (field || row.length) rows.push([...row, field]);
	return rows;
}
