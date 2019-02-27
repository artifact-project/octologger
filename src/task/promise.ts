import { NativePromise } from '../patcher/native';
import { STATE_PENDING, LoggerContext, STATE_REJECTED, STATE_RESOLVED, STATE_FAILED, STATE_ERROR, ProcessState, LoggerScope, STATE_OK } from '../logger/logger.types';
import { now } from '../utils/utils';
import { getMeta, createScopeEntry, switchLoggerContext, revertLoggerContext, getLoggerContext, createLogEntry } from '../logger/logger';
import { LogLevels } from '../logger/levels';
import { TASK_ERROR, TASK_SUCCESS } from './task';

const FINALLY_SUPPROTED = typeof Promise.prototype['finally'] === 'function';

const {
	then:nativeThen,
	catch:nativeCatch,
} = NativePromise.prototype;

type OctoContext = {
	ctx: LoggerContext<any>;
	scope: LoggerScope<any>;
}

type OctoMixin = {
	__octo__: OctoContext;
}

function ContextedPromiseConstructor<T>(
	executor: (
		resolve: (value?: T | PromiseLike<T>) => void,
		reject: (reason?: any) => void,
	) => void,
	ctx: LoggerContext<any>,
) {
	ctx = ctx || getLoggerContext();

	if (ctx == null) {
		return new NativePromise(executor);
	}

	const start = now();
	const info = {
		start,
		end: null as number,
		result: undefined as T,
		reason: undefined as any,
		error: undefined as Error,
	};
	const meta = ctx.options.meta ? getMeta(3) : null;
	const scope = ctx.scope.scope(createScopeEntry(
		LogLevels.verbose,
		'🙏',
		null,
		`Promise created`,
		info,
		meta,
		STATE_PENDING,
	));
	const octo = {
		scope,
		ctx,
	};
	const scopeDetail = scope.scope().detail;
	const promise = new NativePromise((resolve, reject) => {
		const prevContext = switchLoggerContext(ctx, scope);
		const end = (state: ProcessState, value: any) => {
			scopeDetail.state = state;
			info[state === STATE_RESOLVED
				? 'result'
				: state === STATE_REJECTED
					? 'reason'
					: 'error'
			] = value;
			info.end = now();
		}

		try {
			executor(
				// Resolve
				(value) => {
					if (isThenable(value)) {
						patchPromise(value, octo);

						nativeThen.call(
							value,
							(value) => { end(STATE_RESOLVED, value); },
							(reason) => { end(STATE_REJECTED, reason); },
						);
					} else {
						end(STATE_RESOLVED, value);
					}

					resolve(value);
				},

				// Reject
				(reason) => {
					end(STATE_REJECTED, reason);
					reject(reason);
				},
			);
		} catch (error) {
			end(STATE_ERROR, error);
			reject(error);
		}

		revertLoggerContext(prevContext);
	});

	patchPromise(promise, octo);

	return promise;
};

function patchPromise(promise: any, octo: OctoContext) {
	promise.__octo__ = octo;
	promise.then = patchedThen;
	promise.catch = patchedCatch;
}

function patchedThen<T, TResult1 = T, TResult2 = never>(
	this: Promise<T> & OctoMixin,
	onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
	onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
): Promise<TResult1 | TResult2> {
	const resolve = onFulfilled ? wrap('[[Promise.then.onFulfilled]]', this, onFulfilled) : onFulfilled;
	const reject = onRejected ? wrap('[[Promise.then.onRejected]]', this, onRejected) : onRejected;
	const promise = nativeThen.call(this, resolve, reject);

	patchPromise(promise, this.__octo__);

	return promise;
}

function patchedCatch<T, TResult = never>(
	this: Promise<T> & OctoMixin,
	onRejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
): Promise<T | TResult> {
	const reject = !onRejected ? onRejected : wrap('[[Promise.catch.onRejected]]', this, onRejected);
	const promise = nativeCatch.call(this, reject);

	patchPromise(promise, this.__octo__);

	return promise;
}

function wrap(name: string, promise: OctoMixin, callback: Function) {
	return (value) => {
		return call(name, promise.__octo__, callback, value);
	};
}

function call(name: string, octo: OctoContext, callback: Function, value: any): any {
	let ok = false;
	let result: any;
	let error: any;

	const prevContext = switchLoggerContext(octo.ctx, octo.scope);
	const info = {
		result,
		error,
	};

	octo.scope.scope(name, info, (thenScope) => {
		try {
			result = callback(value);
			ok = true;
		} catch (err) {
			error = err;
		}

		const detail = thenScope.scope().detail;
		detail.state = ok ? STATE_RESOLVED : STATE_ERROR;

		if (isThenable(result)) {
			patchPromise(result, {
				ctx: octo.ctx,
				scope: thenScope,
			});
		} else {
			info.result = result;
			info.error = error;
		}
	});

	revertLoggerContext(prevContext);

	if (ok) {
		return result;
	} else {
		throw error;
	}
}

ContextedPromiseConstructor.prototype = Object.create(NativePromise.prototype);
ContextedPromiseConstructor.prototype.constructor = ContextedPromiseConstructor;

export const ScopedPromise: PromiseConstructor = ContextedPromiseConstructor as any;


function isThenable<T>(value: any): value is PromiseLike<T> {
    return (value != null) && value.then;
  }