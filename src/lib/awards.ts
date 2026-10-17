export interface AwardEntry {
	award: string;
	year: number;
	result: 'won' | 'shortlisted';
}

export interface AwardGroup {
	award: string;
	/** Short text for the badge, for example "Hugo ×3 · 2006–2009". */
	label: string;
	/** Every year and result, for the tooltip and screen readers. */
	detail: string;
	won: boolean;
}

const list = (years: number[]) => years.sort((a, b) => a - b).join(', ');

/** One group per award, in the order the awards first appear. */
export function groupAwards(entries: AwardEntry[]): AwardGroup[] {
	const byAward = new Map<string, AwardEntry[]>();
	for (const entry of entries) byAward.set(entry.award, [...(byAward.get(entry.award) ?? []), entry]);

	return [...byAward].map(([award, group]) => {
		const years = group.map((e) => e.year);
		const wins = group.filter((e) => e.result === 'won').map((e) => e.year);
		const shortlists = group.filter((e) => e.result !== 'won').map((e) => e.year);
		const min = Math.min(...years);
		const max = Math.max(...years);
		const label = group.length === 1 ? `${award} ${min}` : `${award} ×${group.length} · ${min}–${max}`;
		const detail = [wins.length ? `won ${list(wins)}` : '', shortlists.length ? `shortlisted ${list(shortlists)}` : '']
			.filter(Boolean)
			.join('; ');
		return { award, label, detail, won: wins.length > 0 };
	});
}
