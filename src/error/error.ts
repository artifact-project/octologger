import { parseStack } from "../stack/stack";

export interface AnyError extends Error {
	fileName?: string;
	lineNumber?: number;
	columnNumber?: number;
}

const DUMMY = {
	fn: '<anonymous>',
	file: '',
	line: 0,
	column: 0,
}

export function parseError(err: AnyError) {
	const stack = parseStack(err.stack);
	const stackFirstRow = stack[0] || DUMMY;

	return {
		name: err.name,
		message: err.message,
		fn: stackFirstRow.fn,
		file: err.fileName || stackFirstRow.file,
		line: err.lineNumber || stackFirstRow.line,
		column: err.columnNumber ||  stackFirstRow.column,
		stack,
	};
}