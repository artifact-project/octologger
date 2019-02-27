export const globalThis = Function('return this')() as Window & {
	setImmediate(handler: (...args: any[]) => void, ...args: any[]): number;
	clearImmediate(pid: number): void;

	requestIdleCallback(fn: () => void, options?: {timeout: number}): number;
	cancelIdleCallback(pid: number): void;

	Promise: PromiseConstructor;
};

export function pause(ms: number) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

export const now = typeof performance !== 'undefined' && performance.now
	? () => performance.now()
	: Date.now
;

export function setHiddenProp<
	T extends object,
	K extends string,
	V extends any,
	R extends T & {
		readonly [X in K]: V;
	}
>(target: T, name: K, value: V): R {
	Object.defineProperty(target, name, {
		value,
		enumerable: false,
	});

	return target as R;
}

export function setReadOnlyProp<
	T extends object,
	K extends string,
	V extends any,
	R extends T & {
		readonly [X in K]: V;
	}
>(target: T, name: K, value: V): R {
	Object.defineProperty(target, name, {
		value,
		writable: false,
		configurable: false,
	});

	return target as R;
}

export function setReadOnlyProps<
	T extends object,
	P extends object,
	R extends T & {readonly [K in keyof P]: P[K]}
>(target: T, props: P): R {
	for (let key in props) {
		if (props.hasOwnProperty(key)) {
			setReadOnlyProp(target, key, props[key]);
		}
	}

	return target as R;
}

export function setHiddenProps<
	T extends object,
	P extends object,
	R extends T & {readonly [K in keyof P]: P[K]}
>(target: T, props: P): R {
	for (let key in props) {
		if (props.hasOwnProperty(key)) {
			setHiddenProp(target, key, props[key]);
		}
	}

	return target as R;
}

export function zeroPad(n: number, min?: 1 | 2) {
	let val = n < 10 ? '0' + n : n;
	if (min > 1 && n < 100) {
		val = `0${val}`;
	}
	return val;
}

export function timeFormat(ts: number) {
	const sec = ts / 1000;

	return `${zeroPad(sec / 60 % 24 | 0)}:${zeroPad(sec % 60 | 0)}.${zeroPad(ts % 1000 | 0, 2)}`
}

export function markAsNativeCode(scope: Window, method: string) {
	scope[method].toString = function () {
		return `function ${method}() { [native code] }`;
	};
}
