import { Format, nodeFromat, browserFormat } from '../format/format';
import { LogLevelsInvert, LogLevels } from '../logger/levels';
import { Entry, EntryTypes } from '../logger/logger.types';
import { setTimeout, console } from '../patcher/native';

export type Output = (entry: Entry) => void;

export type OutputOptions = {
	out?: Partial<Console>;
	format?: Format;
}

export const nodeOutput = (options: OutputOptions = {}): Output => {
	const {
		out = console,
		format = nodeFromat,
	} = options;

	return (entry: Entry) => {
		if (entry === null) {
			return;
		}

		const fn = LogLevelsInvert[entry.level === 6 ? LogLevels.info : entry.level];
		out[fn](...format(entry));
	};
};

type OutputEntry = Entry & {
	printed?: boolean;
}

export const browserOutput = (options: OutputOptions = {}): Output => {
	const {
		out = console,
		format = browserFormat,
	} = options;

	const log = out.log;
	const groups = {};
	const groupSupproted = !!out.group;
	const groupEndSupproted = !!out.groupEnd;
	const groupCollapsedSupproted = !!out.groupCollapsed;

	function printGroup(entry) {
		out.group.apply(out, browserFormat(entry));
	}

	const debounced = {};
	let openScopes: OutputEntry[] = [];

	function print(entry: OutputEntry, skipPrinted?: boolean) {
		if (entry === null) {
			openScopes.forEach(() => {
				out.groupEnd();
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
					out.groupEnd();
				}
			}

			openScopes.length = idx + 1;
		}

		if (entry.type === EntryTypes.scope) {
			if (entry.detail.state === 'idle') {
				entry.printed = true;
				log.apply(out, format(entry));
			} else {
				openScopes.push(entry);
				out.group.apply(out, format(entry));
			}
		} else {
			if (!skipPrinted && parent.printed && parent.label !== '#root') {
				debounced[parent.cid] || (debounced[parent.cid] = setTimeout(() => {
					openScopes.forEach(() => {
						out.groupEnd();
					});
					openScopes.length = 0;

					const chain = [] as OutputEntry[];
					let cursor = parent; let i = 0;

					do {
						chain.unshift(cursor)
						cursor = cursor.parent;
					} while (cursor.label !== '#root');

					chain.forEach(entry => {
						out.group.apply(out, format(entry));
					});

					parent.entries.forEach(entry => {
						print(entry, true);
					})

					chain.forEach(() => {
						out.groupEnd()
					});
				}));

				return;
			}

			entry.printed = true;
			log.apply(out, format(entry));
		}
	};

	return print;
};


export const universalOutput = typeof window !== 'undefined' ? browserOutput : nodeOutput;