import { Entry } from '../logger/logger.types';
import { timeFormat } from '../utils/utils';

const R_VALUE = /:([^;]+)/g;

export type LogStyle = {
	level: Record<string, string | undefined>;
	label: Record<string, string | undefined>;
}

export type StyleByLevel = {
	base: string;
	label: string;
}

export type Format = (entry: Entry) => any[];

export function createFormat(
	styles: LogStyle,
	format: (entry: Entry, colors: StyleByLevel) => string[],
): Format {
	return (entry: Entry) => format(entry, {
		base: styles.level[entry.level] || '',
		label: styles.label[entry.level] || '',
	});
}

export const nodeFromat = createFormat(
	{
		level: {
			log: '\x1b[0m',
			info: '\x1b[34m',
			done: '\x1b[34m',
			warn: '\x1b[33m',
			error: '\x1b[31m',
			verbose: '\x1b[35m',
		},

		label: {
			log: '\x1b[4m',
			info: '\x1b[4m',
			done: '\x1b[4m',
			error: '\x1b[4m',
			warn: '\x1b[4m',
			verbose: '\x1b[4m',
		},
	},

	(entry, style) => {
		const args: string[] = [];

		if (entry.badge != null) {
			args.push(entry.badge)
		}

		if (entry.label != null) {
			args.push(`${style.base}${style.label}${entry.label}\x1b[0m`);
		}

		if (entry.message != null) {
			args.push(`${style.base}${entry.message}`);
		}

		if (entry.detail != null) {
			args.push(entry.detail);
		}

		if (entry.meta !== null) {
			args.push(`${entry.meta.file}:${entry.meta.line}:${entry.meta.col}`);
		}

		args.push('\x1b[0m');

		return args;
	},
);

const LABEL_STYLE = 'text-decoration: underline; font-weight: bold;';

export function resetFormatStyle(val: string) {
	return val.replace(R_VALUE, ': inherit');
}

export const browserFormat = createFormat(
	{
		level: {
			log: 'color: #333;',
			info: 'color: dodgerblue;',
			done: 'color: #1aaa55;',
			warn: 'color: orange;',
			error: 'color: red;',
			verbose: 'color: magenta;',
		},

		label: {
			log: LABEL_STYLE,
			info: LABEL_STYLE,
			done: LABEL_STYLE,
			warn: LABEL_STYLE,
			error: LABEL_STYLE,
			verbose: LABEL_STYLE,
		},
	},

	(entry, style) => {
		const fmt: string[] = [];
		const args: string[] = [];

		if (entry.ts > 0) {
			fmt.push('%c[%s] ');
			args.push(style.base, timeFormat(entry.ts));
		}

		if (entry.badge != null) {
			fmt.push('%s');
			args.push(entry.badge);
		}

		if (entry.label != null) {
			fmt.push('%c%s%c ');
			args.push(style.label + style.base, entry.label, resetFormatStyle(style.label));
		}

		if (entry.message != null) {
			fmt.push('%c%s ');
			args.push(style.base, entry.message);
		}

		if (entry.detail != null) {
			const {detail} = entry;
			const n = detail.length;

			if (entry.message === null && n >= 0 && (0 in detail)) {
				fmt.push('%c');
				args.push(style.base);

				for (let i = 0; i < n; i++) {
					const val = detail[i];

					fmt.push(`${typeof val === 'string' ? '%s' : '%o'} `);
					args.push(val);
				}
			} else {
				fmt.push('%o ');
				args.push(detail);
			}
		}

		if (entry.meta != null) {
			fmt.push('%s');
			args.push(`${entry.meta.file}:${entry.meta.line}:${entry.meta.col}`);
		}

		args.unshift(fmt.join(''));

		return args;
	},
);
