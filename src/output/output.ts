import { Format, nodeFromat, browserFormat } from '../format/format';
import { LogLevelsInvert } from '../logger/levels';
import { Entry } from '../logger/entry';

export type Output = (entry: Entry) => void;

export type OutputOptions = {
	format: Format;
}

export const originalConsole = typeof console !== 'undefined' && console.log ? console : null;

export const nodeOutput = (console: Console = originalConsole) => {
	return (entry: Entry) => {
		const level = LogLevelsInvert[entry.level];
		console[level](...nodeFromat(entry));
	};
};

export const browserOutput = (console: {log: Console['log']} = originalConsole) => {
	const log = console.log.apply
		? console.log
		: Function.prototype.bind.call(console.log, console)
	;

	return (entry: Entry) => {
		log.apply(console, browserFormat(entry));
	};
};


export const consoleOutput = typeof window !== 'undefined' ? browserOutput : nodeOutput;