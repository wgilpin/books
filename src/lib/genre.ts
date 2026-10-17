// Genre from Wikidata labels. Raw labels are stored, so a rule change here needs no refresh.

const SCIENCE_FICTION = /science fiction|science fantasy|space opera|cyberpunk|dystopia|post-apocalyptic|time-travel/;
const FANTASY = /fantasy/;

export interface Genre {
	sf: boolean;
	fantasy: boolean;
}

const SF_AWARDS = new Set(['Clarke', 'Locus SF']);
const FANTASY_AWARDS = new Set(['Locus Fantasy', 'World Fantasy', 'British Fantasy', 'Mythopoeic']);

/** Neither flag set means the genre is unknown. Genre-specific awards classify the book directly. */
export function classifyGenre(labels: string[], awards: { award: string }[]): Genre {
	const text = labels.map((label) => label.toLowerCase());
	return {
		sf: text.some((label) => SCIENCE_FICTION.test(label)) || awards.some((a) => SF_AWARDS.has(a.award)),
		fantasy: text.some((label) => FANTASY.test(label)) || awards.some((a) => FANTASY_AWARDS.has(a.award))
	};
}
