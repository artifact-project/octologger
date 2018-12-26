import { LogLevels } from '../logger/levels';

const taskLogDetail = {
	0: {
		level: LogLevels.info,
		badge: '✅',
		label: 'success',
	},

	1: {
		level: LogLevels.warn,
		badge: '⚠️',
		label: 'cancelled',
	},

	2: {
		level: LogLevels.error,
		badge: '❌',
		label: 'failed',
	},
}

type TaskLogDetail = typeof taskLogDetail;

export function getTaskLogLevel(error: Error, cancelled: boolean) {
	return (+cancelled + +(error != null)*2) as keyof TaskLogDetail;
}

export function getTaskLogDetail<L extends keyof TaskLogDetail>(level: L): TaskLogDetail[L] {
	return taskLogDetail[level];
}
