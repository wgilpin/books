// The list rule. Pure: plain records in, entries out. "Owned" is whatever `owns` says,
// which the caller builds from the Kindle match and the overrides.

export interface WorkInput {
	source: string;
	sourceId: string;
	title: string;
	author: string;
	aliases: string[];
}

export interface AwardInput {
	award: string;
	year: number;
	result: 'won' | 'shortlisted';
}

export interface AwardBookInput extends WorkInput {
	awards: AwardInput[];
}

export interface SeriesMemberInput {
	seriesKey: string;
	seriesName: string;
	work: WorkInput;
	position: number;
}

export interface Entry {
	source: string;
	sourceId: string;
	title: string;
	author: string;
	/** Award entries of the award books this entry stands for, newest first. */
	awards: (AwardInput & { bookTitle: string })[];
	series: { name: string; position: number } | null;
}

interface Group {
	newest: number;
	sortTitle: string;
	books: AwardBookInput[];
	members: SeriesMemberInput[] | null;
}

const keyOf = (work: { source: string; sourceId: string }) => `${work.source}|${work.sourceId}`;

export function buildEntries({
	awardBooks,
	members,
	owns,
	limit = 10
}: {
	awardBooks: AwardBookInput[];
	members: SeriesMemberInput[];
	owns: (work: WorkInput) => boolean;
	limit?: number;
}): Entry[] {
	const bySeries = new Map<string, SeriesMemberInput[]>();
	const seriesOfWork = new Map<string, string[]>();
	for (const member of members) {
		bySeries.set(member.seriesKey, [...(bySeries.get(member.seriesKey) ?? []), member]);
		const key = keyOf(member.work);
		seriesOfWork.set(key, [...(seriesOfWork.get(key) ?? []), member.seriesKey]);
	}
	for (const list of bySeries.values()) list.sort((a, b) => a.position - b.position);

	// Group award books by their most specific series: the one with the fewest numbered members.
	const groups = new Map<string, Group>();
	for (const book of awardBooks) {
		const series = (seriesOfWork.get(keyOf(book)) ?? []).sort(
			(a, b) => bySeries.get(a)!.length - bySeries.get(b)!.length || a.localeCompare(b)
		)[0];
		const groupKey = series ? `series:${series}` : `book:${keyOf(book)}`;
		const group = groups.get(groupKey) ?? {
			newest: -Infinity,
			sortTitle: book.title,
			books: [],
			members: series ? bySeries.get(series)! : null
		};
		group.books.push(book);
		group.newest = Math.max(group.newest, ...book.awards.map((a) => a.year));
		groups.set(groupKey, group);
	}

	const ordered = [...groups.values()].sort((a, b) => b.newest - a.newest || a.sortTitle.localeCompare(b.sortTitle));
	const entries: Entry[] = [];
	for (const group of ordered) {
		if (entries.length >= limit) break;
		const entry = entryFor(group, owns);
		if (entry) entries.push(entry);
	}
	return entries;
}

function entryFor(group: Group, owns: (work: WorkInput) => boolean): Entry | null {
	const awards = group.books
		.flatMap((book) => book.awards.map((a) => ({ ...a, bookTitle: book.title })))
		.sort((a, b) => b.year - a.year || a.award.localeCompare(b.award));

	if (!group.members) {
		const [book] = group.books;
		if (owns(book)) return null;
		return { source: book.source, sourceId: book.sourceId, title: book.title, author: book.author, awards, series: null };
	}

	// The book after the last one I own; the first book when I own none.
	const lastOwned = Math.max(-Infinity, ...group.members.filter((m) => owns(m.work)).map((m) => m.position));
	const next = group.members.find((m) => m.position > lastOwned && !owns(m.work));
	if (!next) return null;
	return {
		source: next.work.source,
		sourceId: next.work.sourceId,
		title: next.work.title,
		author: next.work.author,
		awards,
		series: { name: next.seriesName, position: next.position }
	};
}
