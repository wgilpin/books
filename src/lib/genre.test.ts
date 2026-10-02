import { describe, expect, it } from 'vitest';
import { classifyGenre } from './genre';

const noAwards: { award: string }[] = [];

describe('classifyGenre', () => {
	it.each(['science fiction', 'hard science fiction', 'space opera', 'cyberpunk novel', 'postcyberpunk', 'dystopian fiction', 'post-apocalyptic fiction', 'time-travel fiction'])(
		'counts "%s" as science fiction',
		(label) => {
			expect(classifyGenre([label], noAwards)).toEqual({ sf: true, fantasy: false });
		}
	);

	it('counts any label with "fantasy" as fantasy', () => {
		expect(classifyGenre(['cozy fantasy'], noAwards)).toEqual({ sf: false, fantasy: true });
		expect(classifyGenre(['Historical Fantasy'], noAwards)).toEqual({ sf: false, fantasy: true });
	});

	it('counts science fantasy and mixed labels as both', () => {
		expect(classifyGenre(['science fantasy'], noAwards)).toEqual({ sf: true, fantasy: true });
		expect(classifyGenre(['science fiction', 'fantasy'], noAwards)).toEqual({ sf: true, fantasy: true });
	});

	it('counts a Clarke entry as science fiction when no label says so', () => {
		expect(classifyGenre([], [{ award: 'Clarke' }])).toEqual({ sf: true, fantasy: false });
		expect(classifyGenre(['fantasy'], [{ award: 'Clarke' }])).toEqual({ sf: true, fantasy: true });
	});

	it('leaves the genre unknown with no label, or only other genres', () => {
		expect(classifyGenre([], [{ award: 'Hugo' }])).toEqual({ sf: false, fantasy: false });
		expect(classifyGenre(['horror fiction', 'kaiju'], [{ award: 'Nebula' }])).toEqual({ sf: false, fantasy: false });
	});
});
