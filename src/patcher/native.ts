import { globalThis } from '../utils/utils';

export const console = globalThis.console;

export const setTimeout = globalThis.setTimeout;
export const clearTimeout = globalThis.clearTimeout;

export const setInterval = globalThis.setInterval;
export const clearInterval = globalThis.clearInterval;

export const setImmediate = globalThis.setImmediate;
export const clearImmediate = globalThis.clearImmediate;

export const requestIdleCallback = globalThis.requestIdleCallback;
export const cancelIdleCallback = globalThis.cancelIdleCallback;

export const requestAnimationFrame = globalThis.requestAnimationFrame;
export const cancelAnimationFrame = globalThis.cancelAnimationFrame;

export const NativePromise = globalThis.Promise;
const NativePromisePrototype = NativePromise.prototype;

export const PromiseConstructor = NativePromise;
export const PromiseStatic = {};
export const PromisePrototype = {};

['all', 'race', 'reject', 'resolve'].forEach(key => {
	PromiseStatic[key] = NativePromise[key];
});

['then', 'catch', 'finally'].forEach(key => {
	PromisePrototype[key] = NativePromisePrototype[key];
});