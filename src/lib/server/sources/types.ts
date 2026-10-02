/** Plain records a source returns. Every record carries its source and the source's own id. */
export type Award = 'Hugo' | 'Nebula' | 'Clarke' | 'BSFA';

export interface WorkRecord {
	source: string;
	sourceId: string;
	title: string;
	author: string;
}

export interface AwardRecord {
	source: string;
	sourceId: string;
	workSourceId: string;
	award: Award;
	year: number;
	result: 'won' | 'shortlisted';
}

export interface AliasRecord {
	source: string;
	workSourceId: string;
	alias: string;
}

export interface GenreRecord {
	source: string;
	workSourceId: string;
	label: string;
}

export interface SeriesMemberRecord {
	source: string;
	seriesSourceId: string;
	seriesName: string;
	work: WorkRecord;
	position: number;
}

export interface SourceRecords {
	works: WorkRecord[];
	awards: AwardRecord[];
}
