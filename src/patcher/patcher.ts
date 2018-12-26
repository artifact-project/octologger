import { globalThis } from '../utils/utils';
import { createTimerTask, cancelTimerTask } from '../task/timers';
import { getLoggerContext } from '../logger/logger';

const nativeAPI: Partial<Window> = {};

const timersList = [
	'Timeout',
	'Interval',
	'Immediate',
	'AnimationFrame',
];

function eachTimers(
	scope: Partial<Window>,
	iterator: (
		isRAF: boolean,
		setName: string,
		setFn: Function,
		cancelName: string,
		cancelFn: (pid: number) => void,
	) => void,
) {
	timersList.forEach(name => {
		const isRAF = name === 'AnimationFrame';
		const setName = `${isRAF ? 'request' : 'set'}${name}`;
		const cancelName = `${isRAF ? 'cancel' : 'clear'}${name}`;

		iterator(isRAF, setName, scope[setName], cancelName, scope[cancelName]);
	});
}

// Save origins
eachTimers(globalThis, (_, setName, setFn, cancelName, cancelFn) => {
	nativeAPI[setName] = setFn;
	nativeAPI[cancelName] = cancelFn;
});

function patchTimer(
	scope: Window,
	isRAF: boolean,
	createName: string,
	nativeCreate: Function,
	cancelName: string,
	nativeCancel: (pid: number) => void,
) {
	scope[createName] = function (callback: Function, delay: number = 0, ...params: any[]) {
		const ctx = getLoggerContext();

		if (ctx === null) {
			return isRAF
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
			isRAF,
			params,
		);
	};

	scope[cancelName] = function (pid: number) {
		cancelTimerTask(
			pid,
			nativeCancel,
		);
	};

	markAsNativeCode(scope, createName);
	markAsNativeCode(scope, cancelName);
}

export function patchTimers(scope: Window) {
	eachTimers(nativeAPI, (isRAF, setName, setFn, cancelName, cancelFn) => {
		if (scope[setName] === setFn) {
			patchTimer(scope, isRAF, setName, setFn, cancelName, cancelFn);
		}
	});
}

export function revertPatchTimers(scope: Window) {
	eachTimers(nativeAPI, (_, setName, setFn, cancelName, cancelFn) => {
		scope[setName] = setFn;
		scope[cancelName] = cancelFn;
	});
}

function markAsNativeCode(scope: Window, method: string) {
	scope[method].toString = function () {
		return `function ${method}() { [native code] }`;
	};
	scope[method].native = nativeAPI[method];
}
