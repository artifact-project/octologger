import { now } from '../utils/utils';
import { getTaskLogLevel, getTaskLogDetail } from './task';
import { switchLoggerContext, createLogEntry, revertLoggerContext, createScopeEntry, getMeta } from '../logger/logger';
import { LoggerContext } from '../logger/logger.types';
import { LogLevels } from '../logger/levels';

const timers = {};

export function createTimerTask(
	ctx: LoggerContext<any>,
	name: string,
	delay: number,
	callback: Function,
	nativeCreate: Function,
	isRAF: boolean,
	params: any[] | null,
): number {
	const start = now();
	const detail = {
		pid: null as number,
		start,
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
	));
	timerScope.scope().detail.state = 'idle';

	const resolve = (error: Error, cancelled: boolean) => {
		const level = getTaskLogLevel(error, cancelled);
		const logLevel = getTaskLogDetail(level);

		timerScope.scope().detail.state = level === 0 ? 'completed' : (level === 1 ? 'cancelled' : 'failed');

		ctx.scopeContext.logger.add(createLogEntry(
			logLevel.level,
			logLevel.badge,
			logLevel.label,
			`Timer "${name}" ${level === 0 ? 'completed successfully' : (level === 1 ? 'cancelled' : 'failed')}`,
			{
				error,
				cancelled,
				duration: now() - start,
			},
			meta,
		));
	};
	const pid = nativeCreate((step: number) => {
		const prevContext = switchLoggerContext(ctx, timerScope);
		let error: Error;

		try {
			if (isRAF) {
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
		}

		resolve(error, false);
		revertLoggerContext(prevContext);
	}, delay);

	detail.pid = pid;
	timers[pid] = {
		pid,
		resolve,
		ctx,
		scope: timerScope,
	};

	return pid;
}

export function cancelTimerTask(pid: number, nativeCancel: Function) {
	nativeCancel(pid);

	if (timers.hasOwnProperty(pid)) {
		const timer = timers[pid];
		const prevContext = switchLoggerContext(timer.ctx, timer.scope);

		timer.resolve(null, true);
		revertLoggerContext(prevContext);

		delete timers[pid];
	}
}
