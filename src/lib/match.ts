// Matching owned Kindle books to award works. Strict on purpose: a false match hides a
// book I want with no sign, so author and title must both match (architecture.md).

const plain = (text: string) =>
	text
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();

/** The title before any store copy, without a leading article, letters and digits only. */
export function titleKey(title: string): string {
	const core = plain(title).split(/:|\(|\[| - | – | — /)[0];
	return core
		.replace(/^\s*(the|a|an)\s+/, '')
		.replace(/[^a-z0-9]/g, '');
}

/** "Last, First" or "First Last", letters only, in First Last order. */
export function authorKey(author: string): string {
	const [last, first] = author.split(',').map((part) => part.trim());
	const ordered = first ? `${first} ${last}` : author;
	return plain(ordered).replace(/[^a-z]/g, '');
}

export interface OwnedBook {
	title: string;
	/** As the Kindle export writes them: "Last, First" with '; ' between authors. */
	authors: string;
}

export interface MatchableWork {
	title: string;
	/** As Wikidata gives them: "First Last" with ', ' between authors. */
	author: string;
	aliases: string[];
}

export function ownedIndex(books: OwnedBook[]) {
	const keys = new Set<string>();
	for (const book of books) {
		const title = titleKey(book.title);
		for (const author of book.authors.split(';')) keys.add(`${authorKey(author)}|${title}`);
	}

	return {
		owns(work: MatchableWork): boolean {
			const titles = [work.title, ...work.aliases].map(titleKey).filter(Boolean);
			return work.author
				.split(', ')
				.map(authorKey)
				.some((author) => titles.some((title) => keys.has(`${author}|${title}`)));
		}
	};
}
