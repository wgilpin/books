import type { AliasRecord, Award, AwardRecord, SourceRecords, WorkRecord } from './types';

export const SOURCE = 'wikidata';

const ENDPOINT = 'https://query.wikidata.org/sparql';

// Fixed by the user's global rule for web requests. See ADR 0002 on the risk.
const USER_AGENT = 'OpenAI File Downloader, XaiImageApiFetch/1.0';

const AWARDS: Record<string, Award> = {
	Q255032: 'Hugo',
	Q266012: 'Nebula',
	Q708830: 'Clarke',
	Q4836602: 'BSFA'
};

const awardValues = Object.keys(AWARDS)
	.map((q) => `wd:${q}`)
	.join(' ');

/** Award novels with year and result. Same query as docs/spikes/wikidata/award-novels.rq. */
export const AWARD_NOVELS_QUERY = `
SELECT ?award ?book ?bookLabel ?authorLabel ?prop ?year WHERE {
  VALUES ?award { ${awardValues} }
  VALUES (?p ?ps ?prop) { (p:P1411 ps:P1411 "nominated") (p:P166 ps:P166 "won") }
  ?book ?p ?st . ?st ?ps ?award .
  OPTIONAL { ?st pq:P585 ?t . BIND(YEAR(?t) AS ?year) }
  OPTIONAL { ?book wdt:P50 ?author }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
}`;

/** Other names of award books, for matching store titles. */
export const ALIASES_QUERY = `
SELECT DISTINCT ?book ?alias WHERE {
  VALUES ?award { ${awardValues} }
  { ?book p:P1411/ps:P1411 ?award } UNION { ?book p:P166/ps:P166 ?award }
  ?book skos:altLabel ?alias .
  FILTER(LANG(?alias) IN ("en", "mul"))
}`;

export const fetchAwardNovels = (fetchFn: typeof fetch = fetch) => runQuery(AWARD_NOVELS_QUERY, fetchFn);
export const fetchAliases = (fetchFn: typeof fetch = fetch) => runQuery(ALIASES_QUERY, fetchFn);

async function runQuery(query: string, fetchFn: typeof fetch): Promise<string> {
	const url = `${ENDPOINT}?query=${encodeURIComponent(query)}`;
	const response = await fetchFn(url, {
		headers: { Accept: 'application/sparql-results+json', 'User-Agent': USER_AGENT }
	});
	if (!response.ok) throw new Error(`Wikidata returned ${response.status} ${response.statusText}`);
	return response.text();
}

interface Binding {
	[name: string]: { value: string } | undefined;
}

const qid = (uri: string) => uri.slice(uri.lastIndexOf('/') + 1);

export function parseAwardNovels(body: string): SourceRecords {
	const bindings: Binding[] = JSON.parse(body).results.bindings;
	const works = new Map<string, WorkRecord & { authors: Set<string> }>();
	const awards = new Map<string, AwardRecord>();

	for (const row of bindings) {
		// A row with no author records the nomination on a person, not a book.
		if (!row.authorLabel || !row.book || !row.award || !row.bookLabel) continue;
		const bookId = qid(row.book.value);
		const award = AWARDS[qid(row.award.value)];
		if (!award) continue;

		const work = works.get(bookId) ?? {
			source: SOURCE,
			sourceId: bookId,
			title: row.bookLabel.value,
			author: '',
			authors: new Set<string>()
		};
		work.authors.add(row.authorLabel.value);
		works.set(bookId, work);

		if (!row.year) continue;
		const year = Number(row.year.value);
		const sourceId = `${bookId}|${award}|${year}`;
		const result = row.prop?.value === 'won' ? 'won' : 'shortlisted';
		const existing = awards.get(sourceId);
		if (existing?.result === 'won') continue;
		awards.set(sourceId, { source: SOURCE, sourceId, workSourceId: bookId, award, year, result });
	}

	// A book with no dated award entry has nothing to show.
	const awarded = new Set([...awards.values()].map((a) => a.workSourceId));
	return {
		works: [...works.values()]
			.filter((work) => awarded.has(work.sourceId))
			.map(({ authors, ...work }) => ({ ...work, author: [...authors].join(', ') })),
		awards: [...awards.values()]
	};
}

export function parseAliases(body: string): AliasRecord[] {
	const bindings: Binding[] = JSON.parse(body).results.bindings;
	return bindings
		.filter((row) => row.book && row.alias)
		.map((row) => ({ source: SOURCE, workSourceId: qid(row.book!.value), alias: row.alias!.value }));
}
