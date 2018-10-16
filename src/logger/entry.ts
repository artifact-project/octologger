export const EntryTypes = {
	entry: 0,
	scope: 1,
	group: 2,
	timeMark: 3,
	timeMeasure: 4,
};

export type Entry = {
	type: number;
	badge: string;
	level: number;
	label: string;
	message: string;
	detail: any;
	meta: {
		fn: string;
		file: string;
		line: number;
		column: number;
	};
	parent: Entry;
	entries: Entry[];
}