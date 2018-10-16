import { browserOutput } from "./output";
import { createLogger, createLogEntry } from "../logger/logger";
import { LogLevels } from "../logger/levels";

xit('browser', () => {
	const log = [];
	const logger = createLogger(({setup, logger}) => {
		setup({
			output: [
				browserOutput({
					log: (...args: any[]) => log.push(args),
				}),
			]
		});

		return {
			test: () => logger.add(createLogEntry(LogLevels.info, null, 'fail', 'Critical', 123)),
		};
	});

	logger.test();
	expect(log.length).toEqual(1);
});