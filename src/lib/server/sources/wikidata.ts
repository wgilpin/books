import type { AliasRecord, Award, AwardRecord, GenreRecord, SeriesMemberRecord, SourceRecords, WorkRecord } from './types';

export const SOURCE = 'wikidata';

const ENDPOINT = 'https://query.wikidata.org/sparql';

// Fixed by the user's global rule for web requests. See ADR 0002 on the risk.
const USER_AGENT = 'OpenAI File Downloader, XaiImageApiFetch/1.0';

const AWARDS: Record<string, Award> = {
	Q255032: 'Hugo',
	Q266012: 'Nebula',
	Q708830: 'Clarke',
	Q4836602: 'BSFA',
	Q2576795: 'Locus SF',
	Q607354: 'Locus Fantasy',
	Q2090893: 'Locus First',
	Q898527: 'World Fantasy',
	Q130987259: 'British Fantasy',
	Q135231200: 'Mythopoeic'
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

/** The series that hold an award book. */
export const SERIES_IDS_QUERY = `
SELECT DISTINCT ?series WHERE {
  VALUES ?award { ${awardValues} }
  { ?book p:P1411/ps:P1411 ?award } UNION { ?book p:P166/ps:P166 ?award }
  ?book wdt:P179 ?series .
}`;

/**
 * Numbered members of the given series. One query for all series together times out on
 * Wikidata, so the ids come from SERIES_IDS_QUERY first.
 */
export const seriesMembersQuery = (ids: string[]) => `
SELECT ?series ?seriesLabel ?member ?memberLabel ?authorLabel ?ord WHERE {
  VALUES ?series { ${ids.map((id) => `wd:${id}`).join(' ')} }
  ?member p:P179 ?st . ?st ps:P179 ?series ; pq:P1545 ?ord .
  OPTIONAL { ?member wdt:P50 ?author }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
}`;

/** Genre labels of award books. */
export const GENRES_QUERY = `
SELECT DISTINCT ?book ?genreLabel WHERE {
  VALUES ?award { ${awardValues} }
  { ?book p:P1411/ps:P1411 ?award } UNION { ?book p:P166/ps:P166 ?award }
  ?book wdt:P136 ?genre .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
}`;

export const fetchAwardNovels = (fetchFn: typeof fetch = fetch) => runQuery(AWARD_NOVELS_QUERY, fetchFn);
export const fetchAliases = (fetchFn: typeof fetch = fetch) => runQuery(ALIASES_QUERY, fetchFn);
export const fetchGenres = (fetchFn: typeof fetch = fetch) => runQuery(GENRES_QUERY, fetchFn);
export const fetchSeriesIds = (fetchFn: typeof fetch = fetch) => runQuery(SERIES_IDS_QUERY, fetchFn);
export const fetchSeriesMembers = (ids: string[], fetchFn: typeof fetch = fetch) =>
	runQuery(seriesMembersQuery(ids), fetchFn);

/** POST, because a list of series ids makes the query too long for a URL. */
async function runQuery(query: string, fetchFn: typeof fetch): Promise<string> {
	const response = await fetchFn(ENDPOINT, {
		method: 'POST',
		headers: {
			Accept: 'application/sparql-results+json',
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': USER_AGENT
		},
		body: new URLSearchParams({ query }).toString()
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

export function parseSeriesIds(body: string): string[] {
	const bindings: Binding[] = JSON.parse(body).results.bindings;
	return [...new Set(bindings.filter((row) => row.series).map((row) => qid(row.series!.value)))];
}

export function parseSeriesMembers(body: string): SeriesMemberRecord[] {
	const bindings: Binding[] = JSON.parse(body).results.bindings;
	const members = new Map<string, SeriesMemberRecord & { authors: Set<string> }>();
	for (const row of bindings) {
		if (!row.series || !row.member || !row.ord) continue;
		const position = Number(row.ord.value);
		if (!Number.isFinite(position)) continue;
		const seriesSourceId = qid(row.series.value);
		const memberId = qid(row.member.value);
		const key = `${seriesSourceId}|${memberId}`;
		const member = members.get(key) ?? {
			source: SOURCE,
			seriesSourceId,
			seriesName: row.seriesLabel?.value ?? seriesSourceId,
			work: { source: SOURCE, sourceId: memberId, title: row.memberLabel?.value ?? memberId, author: '' },
			position,
			authors: new Set<string>()
		};
		if (row.authorLabel) member.authors.add(row.authorLabel.value);
		members.set(key, member);
	}
	return [...members.values()].map(({ authors, ...member }) => ({
		...member,
		work: { ...member.work, author: [...authors].join(', ') }
	}));
}

export function parseGenres(body: string): GenreRecord[] {
	const bindings: Binding[] = JSON.parse(body).results.bindings;
	return bindings
		.filter((row) => row.book && row.genreLabel)
		.map((row) => ({ source: SOURCE, workSourceId: qid(row.book!.value), label: row.genreLabel!.value }));
}
