import { createTimerTask, cancelTimerTask } from '../task/timers';
import { getLoggerContext } from '../logger/logger';
import * as nativeAPI from './native';
import { markAsNativeCode } from '../utils/utils';
import { ScopedPromise } from '../task/promise';

const timersList = [
	'Timeout',
	'Interval',
	'Immediate',
	'AnimationFrame',
	'IdleCallback',
];

export function eachTimers(
	scope: Partial<Window>,
	iterator: (
		isReq: boolean,
		setName: string,
		setFn: Function,
		cancelName: string,
		cancelFn: (pid: number) => void,
	) => void,
) {
	timersList.forEach(name => {
		const isReq = name === 'AnimationFrame' || name === 'IdleCallback';
		const setName = `${isReq ? 'request' : 'set'}${name}`;
		const cancelName = `${isReq ? 'cancel' : 'clear'}${name}`;

		iterator(isReq, setName, scope[setName], cancelName, scope[cancelName]);
	});
}

function patchTimer(
	scope: Window,
	isReq: boolean,
	createName: string,
	nativeCreate: Function,
	cancelName: string,
	nativeCancel: (pid: number) => void,
) {
	scope[createName] = function (callback: Function, delay: number = 0, ...params: any[]) {
		const ctx = getLoggerContext();

		if (ctx === null) {
			return isReq
				? nativeCreate(callback)
				: nativeCreate(callback, delay, ...params)
			;
		}

		return createTimerTask(
			ctx,
			createName,
			delay,
			callback,
			nativeCreate,
			isReq,
			params,
		);
	};

	scope[cancelName] = function (pid: number) {
		cancelTimerTask(
			pid,
			createName,
			nativeCancel,
		);
	};

	markAsNativeCode(scope, createName);
	markAsNativeCode(scope, cancelName);
}

export function patchTimers(scope: Window) {
	eachTimers(nativeAPI, (isReq, setName, setFn, cancelName, cancelFn) => {
		if (scope[setName] === setFn) {
			patchTimer(scope, isReq, setName, setFn, cancelName, cancelFn);
		}
	});
}

export function revertPatchTimers(scope: Window) {
	eachTimers(nativeAPI, (_, setName, setFn, cancelName, cancelFn) => {
		scope[setName] = setFn;
		scope[cancelName] = cancelFn;
	});
}

export function patchPromise(scope: Window) {
	// scope['Promise'] = ScopedPromise;
}

export function revertPatchPromise(scope: Window) {
	// const NativePromise: any = nativeAPI.NativePromise;

	// NativePromise.prototype = nativeAPI.PromisePrototype;
	// NativePromise.prototype = nativeAPI.PromisePrototype;

	// scope['Promise'] = NativePromise;
}

export function patchNativeAPI(scope: Window) {
	patchTimers(scope);
	patchPromise(scope);
}

export function revertPatchNativeAPI(scope: Window) {
	revertPatchTimers(scope);
	revertPatchPromise(scope);
}
