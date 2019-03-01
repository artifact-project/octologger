import { browserOutput } from './output';
import { createLogger, createLogEntry } from '../logger/logger';
import { LogLevels } from '../logger/levels';
import { arrayOutput } from './array';

it('browser', () => {
	const log = [];
	const logger = createLogger({
		output: [
			browserOutput({
				out: {
					log: (...args: any[]) => log.push(args),
				},
			}),
		]
	}, ({logger}) => ({
			test: () => logger.add(createLogEntry(LogLevels.info, null, 'fail', 'Critical', 123)),
	}));

	logger.test();
	expect(log.length).toEqual(1);
});

it('array', () => {
	const log = [] as string[];
	const logger = createLogger({
		output: [arrayOutput({out: log})],
	}, () => ({
	}));

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