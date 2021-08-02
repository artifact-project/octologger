import { Format, nodeFromat, browserFormat } from '../format/format';
import { Entry, SCOPE } from '../logger/logger.types';

export type Output = (entry: Entry | null) => void;

export type OutputOptions = {
	out: Pick<Console, 'log' | 'group' | 'groupEnd'>;
	format: Format;
}

type OutputEntry = Entry & {
	printed?: boolean;
}

export const createOutput = (options: OutputOptions): Output => {
	const {
		out,
		format,
	} = options;

	const {log} = out;
	const debounced = {};
	let openScopes: OutputEntry[] = [];

	function print(entry: OutputEntry | null, skipPrinted?: boolean) {
		if (entry === null) {
			openScopes.forEach(() => {
				out.groupEnd();
			});
			openScopes.length = 0;
			return;
		}

		const parent = entry.parent as OutputEntry | null;
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

		if (entry.type === SCOPE) {
			if (entry.detail && entry.detail.state === 'idle') {
				entry.printed = true;
				log.apply(out, format(entry));
			} else {
				openScopes.push(entry);
				out.group.apply(out, format(entry));
			}
		} else {
			if (!skipPrinted && parent && parent.printed && parent.label !== '#root') {
				debounced[parent.cid] || (debounced[parent.cid] = setTimeout(() => {
					openScopes.forEach(() => {
						out.groupEnd();
					});
					openScopes.length = 0;

					const chain = [] as OutputEntry[];
					let cursor: OutputEntry | null = parent;

					do {
						chain.unshift(cursor!);
						cursor = cursor!.parent;
					} while (cursor && cursor.label !== '#root');

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

export const nodeOutput = (options: Partial<OutputOptions> = {}) => createOutput({
	out: options.out || console,
	format: options.format || nodeFromat,
});

export const browserOutput = (options: Partial<OutputOptions> = {}) => createOutput({
	out: options.out || console,
	format: options.format || browserFormat,
});

export const universalOutput = typeof self === 'undefined' ? nodeOutput : browserOutput;
