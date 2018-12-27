import { browserOutput } from "./output";
import { createLogger, createLogEntry } from "../logger/logger";
import { LogLevels } from "../logger/levels";

it('browser', () => {
	const log = [];
	const logger = createLogger({
		output: [
			browserOutput({
				log: (...args: any[]) => log.push(args),
			}),
		]
	}, ({logger}) => ({
			test: () => logger.add(createLogEntry(LogLevels.info, null, 'fail', 'Critical', 123)),
	}));

	logger.test();
	expect(log.length).toEqual(1);
});