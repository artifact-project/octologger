import { LogLevels } from '../logger/levels';

const taskLogDetail = {
	0: {
		level: LogLevels.info,
		badge: null,
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

export function getTaskLogLevel(error: Error, cancelled: boolean): number {
	return (+cancelled + +(error != null)*2);
}

export function getTaskLogDetail(level: number): {level: number; badge: string; label: string} {
	return taskLogDetail[level];
}
