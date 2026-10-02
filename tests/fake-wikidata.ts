// A stand-in for the Wikidata SPARQL endpoint. Tests never call the real service.
import { readFileSync } from 'node:fs';

const read = (name: string) => readFileSync(`tests/fixtures/${name}`, 'utf8');

export const awardFixture = read('wikidata-award-novels.json');
export const aliasFixture = read('wikidata-aliases.json');
export const seriesFixture = read('wikidata-series.json');
export const genreFixture = read('wikidata-genres.json');

/** The series ids in the series fixture, as SERIES_IDS_QUERY would return them. */
export const seriesIdsFixture = JSON.stringify({
	results: {
		bindings: [
			...new Set(JSON.parse(seriesFixture).results.bindings.map((row: any) => row.series.value as string))
		].map((value) => ({ series: { value } }))
	}
});

export function queryOf(init?: RequestInit): string {
	return new URLSearchParams(String(init?.body ?? '')).get('query') ?? '';
}

/** Answers each query with its fixture. Pass overrides to change one answer. */
export function fakeWikidata(overrides: { series?: string } = {}): typeof fetch {
	return (async (_url: string, init?: RequestInit) => {
		const query = queryOf(init);
		if (query.includes('skos:altLabel')) return new Response(aliasFixture);
		if (query.includes('wdt:P136')) return new Response(genreFixture);
		if (query.includes('pq:P1545')) return new Response(overrides.series ?? seriesFixture);
		if (query.includes('SELECT DISTINCT ?series')) return new Response(seriesIdsFixture);
		return new Response(awardFixture);
	}) as typeof fetch;
}
