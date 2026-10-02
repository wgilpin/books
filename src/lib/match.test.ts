import { describe, expect, it } from 'vitest';
import { authorKey, ownedIndex, titleKey } from './match';

const owned = (title: string, authors: string) => ({ title, authors });
const work = (title: string, author: string, aliases: string[] = []) => ({ title, author, aliases });

describe('titleKey', () => {
	it('cuts store copy after a colon, a bracket or a spaced dash', () => {
		expect(titleKey('Venomous Lumpsucker: A Novel')).toBe(titleKey('Venomous Lumpsucker'));
		expect(titleKey('The Gathering Storm (Wheel of Time Book 12)')).toBe(titleKey('The Gathering Storm'));
		expect(titleKey('Shards of Earth - The Final Architecture')).toBe(titleKey('Shards of Earth'));
	});

	it('ignores case, accents, punctuation and a leading article', () => {
		expect(titleKey('THE MINISTRY OF TIME')).toBe(titleKey('Ministry of Time'));
		expect(titleKey('Legends & Lattes')).toBe(titleKey('Legends  Lattes'));
		expect(titleKey('Piranési')).toBe(titleKey('Piranesi'));
	});
});

describe('authorKey', () => {
	it('turns "Last, First" into "First Last"', () => {
		expect(authorKey('Beauman, Ned')).toBe(authorKey('Ned Beauman'));
	});

	it('ignores initials spacing, dots and accents', () => {
		expect(authorKey('Jemisin, N.K.')).toBe(authorKey('N. K. Jemisin'));
		expect(authorKey('Djèlí Clark, P.')).toBe(authorKey('P. Djeli Clark'));
	});
});

describe('ownedIndex', () => {
	const index = ownedIndex([
		owned('Venomous Lumpsucker: A Novel', 'Beauman, Ned'),
		owned('The Fifth Season: The Broken Earth, Book 1', 'Jemisin, N. K.'),
		owned('The Gathering Storm (Wheel of Time Book 12)', 'Jordan, Robert; Sanderson, Brandon'),
		owned('Shards of Earth', 'Tchaikovsky, Adrian')
	]);

	it('matches an owned book by author and title', () => {
		expect(index.owns(work('Venomous Lumpsucker', 'Ned Beauman'))).toBe(true);
		expect(index.owns(work('The Fifth Season', 'N. K. Jemisin'))).toBe(true);
	});

	it('matches when any one of several authors matches', () => {
		expect(index.owns(work('The Gathering Storm', 'Brandon Sanderson'))).toBe(true);
		expect(index.owns(work('The Gathering Storm', 'Robert Jordan, Brandon Sanderson'))).toBe(true);
	});

	it('does not match the same title by a different author', () => {
		expect(index.owns(work('The Fifth Season', 'Someone Else'))).toBe(false);
	});

	it('does not match a different title by the same author', () => {
		expect(index.owns(work('Children of Time', 'Adrian Tchaikovsky'))).toBe(false);
	});

	it('matches a Kindle title equal to an alias of the work', () => {
		const index = ownedIndex([owned('Some Desperate Glory', 'Tesh, Emily')]);
		expect(index.owns(work('Q123300220', 'Emily Tesh', ['Some Desperate Glory']))).toBe(true);
	});
});
