import { Entry } from '../logger/logger.types';
import { LogLevelTypes, LogLevelsInvert } from '../logger/levels';

const R_VALUE = /:([^;]+)/g;

export type LogStyle = {
	level: {
		[K in LogLevelTypes]: string;
	};

	label: {
		[name:string]: string;
	};
}

export type StyleByLevel = {
	base: string;
	label: string;
}

export type Format = (entry: Entry) => any[];

export function createFormat(
	styles: LogStyle,
	format: (level: LogLevelTypes, entry: Entry, colors: StyleByLevel) => string[],
): Format {
	return (entry: Entry) => {
		const level = LogLevelsInvert[entry.level] as LogLevelTypes;

		return format(
			level,
			entry,
			{
				base: styles.level[level],
				label: styles.label[level],
			},
		);
	}
}

export const nodeFromat = createFormat(
	{
		level: {
			error: '\x1b[31m',
			warn: '\x1b[33m',
			log: '\x1b[0m',
			info: '\x1b[34m',
			success: '\x1b[34m',
			verbose: '\x1b[35m',
			debug: '\x1b[35m',
		},

		label: {
			error: '\x1b[4m',
			warn: '\x1b[4m',
			log: '\x1b[4m',
			info: '\x1b[4m',
			success: '\x1b[4m',
			verbose: '\x1b[4m',
			debug: '\x1b[4m',
			silly: '\x1b[4m',
		},
	},

	(_, entry, style) => {
		const args = [];

		if (entry.badge !== null) {
			args.push(entry.badge)
		}

		if (entry.label !== null) {
			args.push(`${style.base}${style.label}${entry.label}\x1b[0m`);
		}

		if (entry.message !== null) {
			args.push(`${style.base}${entry.message}`);
		}

		if (entry.detail !== null) {
			args.push(entry.detail);
		}

		if (entry.meta !== null) {
			args.push(`${entry.meta.file}:${entry.meta.line}:${entry.meta.column} (${entry.meta.fn})`);
		}

		args.push('\x1b[0m');

		return args;
	},
);

const LABEL_STYLE = 'text-decoration: underline; font-weight: bold;';

export const browserFormat = createFormat(
	{
		level: {
			error: 'color: red;',
			warn: 'color: orange;',
			log: 'color: #333;',
			success: 'color: #1aaa55;',
			info: 'color: dodgerblue;',
			verbose: 'color: magenta;',
			debug: 'color: #8b1fdd;',
		},

		label: {
			error: LABEL_STYLE,
			warn: LABEL_STYLE,
			log: LABEL_STYLE,
			info: LABEL_STYLE,
			success: LABEL_STYLE,
			verbose: LABEL_STYLE,
			debug: LABEL_STYLE,
			silly: LABEL_STYLE,
		},
	},

	(_, entry, style) => {
		const fmt = [];
		const args = [];

		if (entry.badge !== null) {
			fmt.push('%s');
			args.push(entry.badge);
		}

		if (entry.label !== null) {
			fmt.push('%c%s%c ');
			args.push(style.label + style.base, entry.label, style.label.replace(R_VALUE, ': inherit'));
		}

		if (entry.message !== null) {
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

		if (entry.meta !== null) {
			fmt.push('%s');
			args.push(`${entry.meta.file}:${entry.meta.line}:${entry.meta.column} (${entry.meta.fn})`);
		}

		args.unshift(fmt.join(''));

		return args;
	},
);