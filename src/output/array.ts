import { OutputOptions, createOutput } from './output';
import { plainTextFormat } from '../format/plain-text';

export type ArrayOutputOptions = {
	out: string[];
	format?: OutputOptions['format'];
}

const firstIndent = '  | ';
const nextIndent = '   ';

export const arrayOutput = (options: ArrayOutputOptions) => {
	let indent = '';
	const out = options.out;
	const fakeConsole = {
		log: (...args: string[]) => {
			out.push(`${indent}${args.join(' ')}`);
		},

		group: (...args: string[]) => {
			out.push(`${indent}${args.join(' ')}`);
			indent = indent ? `${nextIndent}${indent}` : firstIndent;
		},

		groupEnd: () => {
			indent = indent === firstIndent ? '' : firstIndent.substr(nextIndent.length);
		},

		groupCollapsed: () => {
			fakeConsole.groupEnd();
		},
	};

	return createOutput({
		out: fakeConsole,
		format: options.format || plainTextFormat,
	});
}
