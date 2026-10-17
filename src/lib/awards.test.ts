import { describe, expect, it } from 'vitest';
import { groupAwards } from './awards';

describe('groupAwards', () => {
	it('gives a single entry its year', () => {
		expect(groupAwards([{ award: 'Clarke', year: 2023, result: 'won' }])).toEqual([
			{ award: 'Clarke', label: 'Clarke 2023', detail: 'won 2023', won: true }
		]);
	});

	it('folds repeats of one award into a count and a year range, in first-seen order', () => {
		const groups = groupAwards([
			{ award: 'Locus SF', year: 2026, result: 'shortlisted' },
			{ award: 'Hugo', year: 2009, result: 'shortlisted' },
			{ award: 'Hugo', year: 2008, result: 'won' },
			{ award: 'Locus SF', year: 2016, result: 'shortlisted' },
			{ award: 'Hugo', year: 2006, result: 'shortlisted' }
		]);
		expect(groups).toEqual([
			{ award: 'Locus SF', label: 'Locus SF ×2 · 2016–2026', detail: 'shortlisted 2016, 2026', won: false },
			{ award: 'Hugo', label: 'Hugo ×3 · 2006–2009', detail: 'won 2008; shortlisted 2006, 2009', won: true }
		]);
	});
});
