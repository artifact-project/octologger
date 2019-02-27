import { LogLevels } from '../logger/levels';

export const TASK_SUCCESS = {
	level: LogLevels.info,
	badge: null,
	label: 'success',

};

export const TASK_WARN = {
	level: LogLevels.warn,
	badge: '⚠️',
	label: 'cancelled',
};

export const TASK_ERROR ={
	level: LogLevels.error,
	badge: '❌',
	label: 'failed',
};

const taskLogDetail = {
	0: TASK_SUCCESS,
	1: TASK_WARN,
	2: TASK_ERROR,
}

type TaskLogDetail = typeof taskLogDetail;

export function getTaskLogLevel(error: Error, cancelled: boolean): number {
	return (+cancelled + +(error != null)*2);
}

export function getTaskLogDetail(level: number): {level: number; badge: string; label: string} {
	return taskLogDetail[level];
}
