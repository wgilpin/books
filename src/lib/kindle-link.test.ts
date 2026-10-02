import { describe, expect, it } from 'vitest';
import { kindleLink } from './kindle-link';

describe('kindleLink', () => {
	it('searches Kindle UK books for the title and author', () => {
		expect(kindleLink('Venomous Lumpsucker', 'Ned Beauman')).toBe(
			'https://www.amazon.co.uk/s?k=Venomous+Lumpsucker+Ned+Beauman&i=digital-text'
		);
	});

	it('encodes characters that would break the query', () => {
		expect(kindleLink('Legends & Lattes', 'Travis Baldree')).toBe(
			'https://www.amazon.co.uk/s?k=Legends+%26+Lattes+Travis+Baldree&i=digital-text'
		);
	});
});
