import { describe, expect, it } from 'vitest';
import { backupsToDelete } from './retention.mjs';

// One backup a day from 2026-01-01 to 2026-10-02.
const days: string[] = [];
for (let d = new Date('2026-01-01T00:00:00Z'); d <= new Date('2026-10-02T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
	days.push(`books-${d.toISOString().slice(0, 10)}.db`);
}

describe('backupsToDelete', () => {
	const doomed = new Set(backupsToDelete(days));
	const kept = days.filter((name) => !doomed.has(name));

	it('keeps the newest 7 daily copies', () => {
		expect(kept.slice(-7)).toEqual(days.slice(-7));
	});

	it('keeps the newest copy of each of the last 4 weeks, the current week included', () => {
		// Weeks start on Monday. 2026-10-02 is a Friday; 09-27, 09-20 and 09-13 are Sundays.
		for (const day of ['2026-10-02', '2026-09-27', '2026-09-20', '2026-09-13']) {
			expect(kept).toContain(`books-${day}.db`);
		}
		expect(kept).not.toContain('books-2026-09-06.db');
	});

	it('keeps the newest copy of each of the last 6 months, the current month included', () => {
		for (const day of ['2026-10-02', '2026-09-30', '2026-08-31', '2026-07-31', '2026-06-30', '2026-05-31']) {
			expect(kept).toContain(`books-${day}.db`);
		}
		expect(kept).not.toContain('books-2026-04-30.db');
	});

	it('deletes every other copy', () => {
		expect(kept).toHaveLength(new Set(kept).size);
		expect(kept.length).toBeLessThanOrEqual(7 + 4 + 6);
		expect(kept).not.toContain('books-2026-03-31.db');
		expect(kept).not.toContain('books-2026-09-15.db');
	});

	it('ignores files that are not dated backups', () => {
		expect(backupsToDelete(['notes.txt', ...days])).not.toContain('notes.txt');
	});
});
