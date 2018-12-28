import { Format, nodeFromat, browserFormat } from '../format/format';
import { LogLevelsInvert } from '../logger/levels';
import { Entry, EntryTypes } from '../logger/logger.types';
import { nativeAPI } from '../patcher/native';

export type Output = (entry: Entry) => void;

export type OutputOptions = {
	format: Format;
}

export const originalConsole = typeof console !== 'undefined' && console.log ? console : null;

export const nodeOutput = (console: Console = originalConsole): Output => {
	return (entry: Entry) => {
		if (entry === null) {
			return;
		}

		const level = LogLevelsInvert[entry.level];
		console[level](...nodeFromat(entry));
	};
};

type OutputEntry = Entry & {
	printed?: boolean;
}

export const browserOutput = (console: Partial<Console> = originalConsole): Output => {
	const log = console.log.apply
		? console.log
		: Function.prototype.bind.call(console.log, console)
	;
	const groups = {};
	const groupSupproted = !!console.group;
	const groupEndSupproted = !!console.groupEnd;
	const groupCollapsedSupproted = !!console.groupCollapsed;
	const {
		setTimeout,
	} = nativeAPI;

	function printGroup(entry) {
		console.group.apply(console, browserFormat(entry));
	}

	const debounced = {};
	let openScopes: OutputEntry[] = [];

	function print(entry: OutputEntry, skipPrinted?: boolean) {
		if (entry === null) {
			openScopes.forEach(() => {
				console.groupEnd();
			});
			openScopes.length = 0;
			return;
		}

		const parent = entry.parent as OutputEntry;
		const opened = openScopes.length;

		if (skipPrinted && entry.printed) {
			return;
		}

		if (opened > 0) {
			let idx = opened;

			while (idx--) {
				if (openScopes[idx] === parent) {
					break;
				} else {
					openScopes[idx].printed = true;
					console.groupEnd();
				}
			}

			openScopes.length = idx + 1;
		}

		if (entry.type === EntryTypes.scope) {
			if (entry.detail.state === 'idle') {
				entry.printed = true;
				log.apply(console, browserFormat(entry));
			} else {
				openScopes.push(entry);
				console.group.apply(console, browserFormat(entry));
			}
		} else {
			if (!skipPrinted && parent.printed && parent.label !== '#root') {
				debounced[parent.cid] || (debounced[parent.cid] = setTimeout(() => {
					openScopes.forEach(() => {
						console.groupEnd();
					});
					openScopes.length = 0;

					const chain = [] as OutputEntry[];
					let cursor = parent; let i = 0;

					do {
						chain.unshift(cursor)
						cursor = cursor.parent;
					} while (cursor.label !== '#root');

					chain.forEach(entry => {
						console.group.apply(console, browserFormat(entry));
					});

					parent.entries.forEach(entry => {
						print(entry, true);
					})

					chain.forEach(() => {
						console.groupEnd()
					});
				}));

				return;
			}

			entry.printed = true;
			log.apply(console, browserFormat(entry));
		}
	};

	return print;
};


export const consoleOutput = typeof window !== 'undefined' ? browserOutput : nodeOutput;