// Genre from Wikidata labels. Raw labels are stored, so a rule change here needs no refresh.

const SCIENCE_FICTION = /science fiction|science fantasy|space opera|cyberpunk|dystopia|post-apocalyptic|time-travel/;
const FANTASY = /fantasy/;

export interface Genre {
	sf: boolean;
	fantasy: boolean;
}

/** Neither flag set means the genre is unknown. The Clarke award is for science fiction only. */
export function classifyGenre(labels: string[], awards: { award: string }[]): Genre {
	const text = labels.map((label) => label.toLowerCase());
	return {
		sf: text.some((label) => SCIENCE_FICTION.test(label)) || awards.some((a) => a.award === 'Clarke'),
		fantasy: text.some((label) => FANTASY.test(label))
	};
}
