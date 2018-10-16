import logger from './logger';
import { parseError } from '../error/error';
import { LogLevels } from './levels';

describe('core', () => {
	logger.clear();
	logger.setup({meta: false, output: []});

	Object.keys(LogLevels).forEach((level) => {
		describe(level, () => {
			if (!logger.hasOwnProperty(level)) {
				throw new Error(`Level "${level}" not supproted`);
			}

			logger[level](level);

			const entry = logger.getLastEntry();

			it('level', () => {
				expect(entry.level).toBe(LogLevels[level]);
			});

			it('detail', () => {
				expect(entry.detail).toEqual([level]);
			});
		});
	});
});

describe('meta', function metaTest() {
	logger.clear();
	logger.setup({meta: true, output: []});

	const metaErr = parseError(new Error);
	logger.log('wow');

	const entry = logger.getLastEntry();

	it('fn', () => {
		expect(entry.meta.fn).toEqual(metaErr.fn);
	});

	it('file', () => {
		expect(entry.meta.file).toEqual(metaErr.file);
	});

	it('line', () => {
		expect(entry.meta.line).toEqual(metaErr.line + 1);
	});

	it('column', () => {
		expect(entry.meta.column).toEqual(9);
	});
});
