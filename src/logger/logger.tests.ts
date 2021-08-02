import {logger} from './logger';
import { Entry, EntryMeta } from './logger.types';

beforeEach(() => {
	logger.clear();
	logger.setup({meta: false, output: null});
});

describe('core', () => {
	['add', 'log', 'info', 'done', 'warn', 'verbose', 'error'].forEach((level) => {
		describe(level, () => {
			it('support', () => {
				if (!logger.hasOwnProperty(level)) {
					throw new Error(`Level "${level}" not supproted`);
				}
			});

			it('detail', () => {
				// Add Log Record
				logger[level](level);
				expect(logger.last().detail).toEqual([level]);
			});
		});
	});
});

describe('meta', () => {
	const log: Entry[] = [];
	const toMeta = (arg: any): EntryMeta => ({file: arg[0], line: arg[1], col: arg[2]});
	
	beforeEach(() => {
		log.length = 0;
		logger.setup({output: (entry) => log.push(entry!)});
	});
	
	it('log', () => {
		const meta = ['log.ts', 123, 456];

		logger.add(meta, 'log-with-meta');

		expect(log.length).toBe(1);
		expect(log[0].detail).toEqual(['log-with-meta']);
		expect(log[0].meta).toEqual(toMeta(meta));
	});
	
	it('scope', () => {
		const meta = ['scope.ts', 123, 456];

		(logger.scope as any)(meta, 'scope-with-meta', {foo: 123});

		expect(log.length).toBe(1);
		expect(log[0].message).toEqual('scope-with-meta');
		expect(log[0].detail).toEqual({foo: 123});
		expect(log[0].meta).toEqual(toMeta(meta));
	});
});
