import { Promise as NativePromise } from '../patcher/native';
import { LoggerContext, STATE_PENDING } from '../logger/logger.types';
import { now } from '../utils/utils';
import { getMeta, createScopeEntry, switchLoggerContext, revertLoggerContext } from '../logger/logger';
import { LogLevels } from '../logger/levels';

const FINALLY_SUPPROTED = typeof Promise.prototype['finally'] === 'function';

function ContextedPromiseConstructor<T>(
	ctx: LoggerContext<any>,
	executor: (
		resolve: (value?: T | PromiseLike<T>) => void,
		reject: (reason?: any) => void,
	) => void
) {
	const start = now();
	const info = {
		start,
		end: null as number,
		result: null as T,
		error: null as Error,
	};
	const meta = ctx.options.meta ? getMeta(3) : null;
	const timerScope = ctx.scope.scope(createScopeEntry(
		LogLevels.verbose,
		'🙏',
		null,
		`Promise created`,
		info,
		meta,
		STATE_PENDING,
	));
	const timerDetail = timerScope.scope().detail;

	return new NativePromise((resolve, reject) => {
		const prevContext = switchLoggerContext(ctx, timerScope);
		let retVal: any;
		let err: any;

		try {
			executor((val) => {
				retVal = val;
			}, () => {

			});

		} catch (err) {

		}

		revertLoggerContext(prevContext);
	});
};

ContextedPromiseConstructor.prototype = Object.create(NativePromise.prototype);
ContextedPromiseConstructor.prototype.constructor = ContextedPromiseConstructor;

export const PatchedPromise: PromiseConstructor = ContextedPromiseConstructor as any;