import type { Genre } from './genre';

// The list rule. Pure: plain records in, entries out. The caller's `markOf` says what I
// decided about each book: the Kindle match and the marks I set on the page.

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
	genre: Genre;
}

export type GenreFilter = 'sf' | 'fantasy';

/** What I decided about a book. The Kindle match counts as owned. */
export type Mark = 'owned' | 'read' | 'rejected' | 'queued';
type MarkOf = (work: WorkInput) => Mark | undefined;

/** Owned and read books are behind me: a series moves past them. */
const done = (mark: Mark | undefined) => mark === 'owned' || mark === 'read';

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
	/** From the award books. Neither flag set means unknown. */
	genre: Genre;
	/** The award books this entry stands for; setting a genre applies to them. */
	awardBooks: { source: string; sourceId: string }[];
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
	markOf,
	limit = 10,
	genre,
	includeUnknown = true
}: {
	awardBooks: AwardBookInput[];
	members: SeriesMemberInput[];
	markOf: MarkOf;
	limit?: number;
	genre?: GenreFilter;
	/** Off leaves out unknown-genre entries under every filter. */
	includeUnknown?: boolean;
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

	const awardCount = (group: Group) => group.books.reduce((n, book) => n + book.awards.length, 0);
	const winCount = (group: Group) =>
		group.books.reduce((n, book) => n + book.awards.filter((a) => a.result === 'won').length, 0);
	const ordered = [...groups.values()].sort(
		(a, b) =>
			b.newest - a.newest ||
			awardCount(b) - awardCount(a) ||
			winCount(b) - winCount(a) ||
			a.sortTitle.localeCompare(b.sortTitle)
	);
	const entries: Entry[] = [];
	for (const group of ordered) {
		if (entries.length >= limit) break;
		const entry = entryFor(group, markOf);
		if (entry && matches(entry.genre, genre, includeUnknown)) entries.push(entry);
	}
	return entries;
}

function matches(genre: Genre, filter: GenreFilter | undefined, includeUnknown: boolean): boolean {
	const unknown = !genre.sf && !genre.fantasy;
	if (unknown) return includeUnknown;
	return !filter || genre[filter];
}

function entryFor(group: Group, markOf: MarkOf): Entry | null {
	const genre = {
		sf: group.books.some((book) => book.genre.sf),
		fantasy: group.books.some((book) => book.genre.fantasy)
	};
	const awardBooks = group.books.map((book) => ({ source: book.source, sourceId: book.sourceId }));
	const awards = group.books
		.flatMap((book) => book.awards.map((a) => ({ ...a, bookTitle: book.title })))
		.sort((a, b) => b.year - a.year || a.award.localeCompare(b.award));

	if (!group.members) {
		const [book] = group.books;
		const mark = markOf(book);
		if (mark) return null;
		return { source: book.source, sourceId: book.sourceId, title: book.title, author: book.author, awards, series: null, genre, awardBooks };
	}

	// Rejecting any book of a series rejects the series (ISS-11). A queued book holds its
	// series on the queue page, so the list does not move on past it.
	if (group.members.some((m) => markOf(m.work) === 'rejected' || markOf(m.work) === 'queued')) return null;

	// The book after the last one I own or read; the first book when there is none.
	const lastOwned = Math.max(-Infinity, ...group.members.filter((m) => done(markOf(m.work))).map((m) => m.position));
	const next = group.members.find((m) => m.position > lastOwned && !done(markOf(m.work)));
	if (!next) return null;
	return {
		source: next.work.source,
		sourceId: next.work.sourceId,
		title: next.work.title,
		author: next.work.author,
		awards,
		series: { name: next.seriesName, position: next.position },
		genre,
		awardBooks
	};
}
