const R_AT_WITH_PROTOCOL = /at\s+([^\s]+)(?:.*?)\(((?:http|file|\/)[^)]+:\d+)\)/;
const R_AT = /at\s+([^\s]+)(?:.*?)\(((?:http|file|\/)[^)]+:\d+)\)/;
const R_EXTRACT_FILE1 = /^(.*?)(?:\/<)*@(.*?)$/;
const R_EXTRACT_FILE2 = /^()(https?:\/\/.+)/;
const R_FILE = /^(.*?):(\d+)(?::(\d+))?$/;

export type StackRow = {
	file: string;
	fn: string;
	line: number;
	column: number;
}

export function parseStackRow(value: string): StackRow {
	if (value == null) {
		return null;
	}

	let line = value.match(R_AT_WITH_PROTOCOL);

	if (!line) {
		line = value.match(R_AT);

		if (line) {
			line[0] = '';
			line.unshift('');
		} else {
			line = value.match(R_EXTRACT_FILE1) || value.match(R_EXTRACT_FILE2);
		}
	}

	if (line) {
		const file = line[2].match(R_FILE);
		const row = {
			fn: (line[1].trim() || '<anonymous>'),
			file: '',
			line: 0,
			column: 0,
		};

		if (file) {
			row.file = file[1];
			row.line = parseInt(file[2], 10) || 0;
			row.column = parseInt(file[3], 10) || 0;
		}

		return row;
	}

	return null;
}

export function parseStack(stack: string): StackRow[] {
	if (stack == null) {
		return null;
	}

	const rows = stack.trim().split('\n');
	const list = [] as StackRow[];

	for (let i = 0; i < rows.length; i++) {
		const row = parseStackRow(rows[i]);

		if (row !== null) {
			list.push(row);
		}
	}

	return list;
}