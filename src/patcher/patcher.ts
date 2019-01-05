import { createTimerTask, cancelTimerTask } from '../task/timers';
import { getLoggerContext } from '../logger/logger';
import * as nativeAPI from './native';

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

export function patchNativeAPI(scope: Window) {
	patchTimers(scope);
}

export function revertPatchNativeAPI(scope: Window) {
	revertPatchTimers(scope);
}

function markAsNativeCode(scope: Window, method: string) {
	scope[method].toString = function () {
		return `function ${method}() { [native code] }`;
	};
	scope[method].native = nativeAPI[method];
}
