import { now, globalThis } from '../utils/utils';
import { getTaskLogLevel, getTaskLogDetail } from './task';
import { switchLoggerContext, createLogEntry, revertLoggerContext, createScopeEntry, getMeta } from '../logger/logger';
import { LoggerContext, STATE_IDLE, STATE_COMPLETED, STATE_CANCELLED, STATE_FAILED, STATE_INTERACTIVE, ProcessState } from '../logger/logger.types';
import { LogLevels } from '../logger/levels';

const timers = {} as {
	[pid:string]: {
		pid: string;
		ctx: LoggerContext<any>
		resolve: (err: Error) => void;
		detail: {
			state: ProcessState;
		};
	};
};

export function createTimerTask(
	ctx: LoggerContext<any>,
	name: string,
	delay: number,
	callback: Function,
	nativeCreate: Function,
	isReq: boolean,
	params: any[] | null,
): number {
	const looped = name === 'setInterval' || isReq;
	let start = now();
	const detail = {
		pid: null as number,
		start,
		end: null as number,
		delay,
	};
	const meta = ctx.options.meta ? getMeta(3) : null;
	const timerScope = ctx.scope.scope(createScopeEntry(
		LogLevels.verbose,
		'⏲',
		null,
		`Timer "${name}" started`,
		detail,
		meta,
		STATE_IDLE,
	));
	const timerDetail = timerScope.scope().detail;

	const resolve = (error: Error) => {
		const cancelled = timerDetail.state === STATE_CANCELLED;
		const level = getTaskLogLevel(error, cancelled);
		const logLevel = getTaskLogDetail(level);
		const end = now();

		timerDetail.state = level === 0
			? (looped ? STATE_IDLE : STATE_COMPLETED)
			: (level === 1 ? STATE_CANCELLED : STATE_FAILED)
		;
		timerDetail.info.end = end;

		ctx.scopeContext.logger.add(createLogEntry(
			logLevel.level,
			logLevel.badge,
			logLevel.label,
			`Timer "${name}"${
				looped
					? ' step'
					: ''
			} ${
				level === 0
					? 'completed successfully'
					: (level === 1 ? STATE_CANCELLED : STATE_FAILED)
			}`,
			{
				error,
				cancelled,
				start,
				duration: end - start,
			},
			meta,
		));

		start = end;
	};
	const pid = nativeCreate((step: number) => {
		const prevContext = switchLoggerContext(ctx, timerScope);
		let error: Error = null;

		start = now();
		timerDetail.state = STATE_INTERACTIVE;

		try {
			if (isReq) {
				callback(step);
			} else if (!callback.length || !params.length) {
				callback();
			} else {
				switch (params.length) {
					case 1: callback(params[0]); break;
					case 2: callback(params[0], params[1]); break;
					case 3: callback(params[0], params[1], params[2]); break;
					case 4: callback(params[0], params[1], params[2], params[3]); break;
					case 5: callback(params[0], params[1], params[2], params[3], params[4]); break;
					default: callback(...params); break;
				}
			}
		} catch (err) {
			error = err;
			globalThis.console.error(err);
		}

		resolve(error);
		revertLoggerContext(prevContext);
	}, delay);

	detail.pid = pid;
	timers[`${name}:${pid}`] = {
		pid,
		resolve,
		ctx,
		detail: timerDetail,
	};

	return pid;
}

export function cancelTimerTask(pid: number, name: string, nativeCancel: Function) {
	nativeCancel(pid);

	const key = `${name}:${pid}`;
	const timer = timers[key];

	if (timer !== void 0) {
		timer.detail.state = STATE_CANCELLED;
		delete timers[key];
	}
}
