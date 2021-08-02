export type {
	Logger,
	Logger as OctoLogger,
	Entry as LoggerEntry,
} from './src/logger/logger.types';

export {
	logger,
	logger as xlog,
	logger as octoLogger,
	createLogger,
} from './src/logger/logger';

export {
	createOutput,
	browserOutput,
	nodeOutput,
	universalOutput,
} from './src/output/output';

export {
	browserFormat,
	nodeFromat,
	createFormat
} from './src/format/format';
