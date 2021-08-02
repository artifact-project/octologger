import { browserOutput } from './output';
import { createLogger } from '../logger/logger';
import { arrayOutput } from './array';

describe('output', () => {
	it('browser', () => {
		const log: any[] = [];
		const logger = createLogger({
			output: browserOutput({
				out: {
					log: (...args: any[]) => log.push(args),
					group: () => {},
					groupEnd: () => {},
				},
			}),
		}, ({logger, createEntry}) => ({
			test: () => logger.add(createEntry('info', null, 'fail', 'Critical', 123)),
		}));

		logger.test();
		expect(log.length).toEqual(1);
	});

	it('array', () => {
		const log: string[] = [];
		const logger = createLogger({
			time: false,
			output: arrayOutput({out: log}),
		}, () => ({}));

		logger.add('foo', [1, 2], 'and', null, '!==', void 0);
		logger.scope('root', () => {
			logger.add('bar');
			logger.scope('deep', () => {
				logger.add('baz');
				logger.scope('deeper', () => {
					logger.add('wow');
				});
			});
		});
		logger.add('qux');

		expect(log.join('\n')).toMatchSnapshot();
	});
});
