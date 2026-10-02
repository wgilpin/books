/** A Kindle UK search for one book. It lands on search results, not a product page. */
export function kindleLink(title: string, author: string): string {
	const query = new URLSearchParams({ k: `${title} ${author}`, i: 'digital-text' });
	return `https://www.amazon.co.uk/s?${query}`;
}
