import { globalThis } from '../utils/utils';

export const nativeAPI = {
	console: globalThis.console,
} as Pick<Window & {
	setImmediate: (fn: () => void) => number;
	cancelIdleCallback: (pid: number) => void;
},
	'setTimeout'
	| 'clearTimeout'
	| 'setInterval'
	| 'clearInterval'
	| 'setImmediate'
	| 'requestAnimationFrame'
	| 'console'
>;

const timersList = [
	'Timeout',
	'Interval',
	'Immediate',
	'AnimationFrame',
];

export function eachTimers(
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