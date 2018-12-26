import { parseStack, StackRow } from '../stack/stack';

export interface AnyError extends Error {
	fileName?: string;
	lineNumber?: number;
	columnNumber?: number;
}

export type XError = {
	name: string;
	message: string;
	fn: string;
	file: string;
	line: number;
	column: number;
	stack: StackRow[];
}

const DUMMY = {
	fn: '<anonymous>',
	file: '',
	line: 0,
	column: 0,
}

export function parseError(err: AnyError): XError {
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