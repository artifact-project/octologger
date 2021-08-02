import { createFormat } from './format';
import { timeFormat } from '../utils/utils';

export const plainTextFormat = createFormat(
	{label: {}, level: {}},
	(entry) => {
		const fmt: string[] = [];

		if (entry.ts > 0) {
			fmt.push(`[${timeFormat(entry.ts!)}]`);
		}

		if (entry.badge != null) {
			fmt.push(entry.badge);
		}

		if (entry.label != null) {
			fmt.push(`(${entry.label})`);
		}

		if (entry.message != null) {
			fmt.push(entry.message);
		}

		if (entry.detail != null) {
			const {detail} = entry;
			const n = detail.length;

			if (entry.message === null && n >= 0 && (0 in detail)) {
				for (let i = 0; i < n; i++) {
					fmt.push(stringify(detail[i]));
				}
			} else {
				fmt.push(stringify(detail));
			}
		}

		if (entry.meta != null) {
			fmt.push(`${entry.meta.file}:${entry.meta.line}:${entry.meta.col}`);
		}

		return fmt;
	},
);

const {toString} = ({});
const R_PRIMITIVE = /string|number|boolean/i;

function stringify(val?: any) {
	try {
		const type = toString.call(val);

		if (R_PRIMITIVE.test(type) || val == null) {
			return val == null ? (val === null ? 'null' : 'undefined') : val;
		}

		return JSON.stringify(val);
	} catch (_) {
		return val;
	}
}
