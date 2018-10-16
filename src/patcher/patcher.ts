import { startTask, cancelTask } from '../task/task';

const globals: Window = Function('return this')();
const original: Partial<Window> = {};

const timersList = [
	'Timeout',
	'Interval',
	'Immediate',
	'AnimationFrame',
];

timersList.forEach(name => {
	const isRAF = name === 'AnimationFrame';
	const setName = `${isRAF ? 'request' : 'set'}${name}`;
	const cancelName = `${isRAF ? 'cancel' : 'clear'}${name}`;

	original[setName] = globals[setName];
	original[cancelName] = globals[cancelName];
});

function patchTimer(
	globals: Window,
	isRAF: boolean,
	setName: string,
	setFn: Function,
	cancelName: string,
	cancelFn: (pid: number) => void,
) {
	if (isRAF) {
		globals[setName] = function (callback: Function) {
			const task = startTask(setName, cancelFn, setFn((timestamp: number) => {
				try {
					callback(timestamp);
				} catch (err) {
					task.end(err);
				} finally {
					task.end();
				}
			}));

			return task.pid;
		};
	} else {
		globals[setName] = function (callback: Function, delay: number, ...params: any[]) {
			const task = startTask(setName, cancelFn, setFn(() => {
				try {
					if (!callback.length || !params.length) {
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
					task.end(err);
				} finally {
					task.end();
				}
			}, delay));

			return task.pid;
		};
	}

	globals[cancelName] = function (pid: number) {
		cancelTask(setName, pid);
	};

	markAsNativeCode(globals, setName);
	markAsNativeCode(globals, cancelName);
}

function markAsNativeCode(globals: Window, method: string) {
	globals[method].toString = () => `function ${method}() { [native code] }`;
}
