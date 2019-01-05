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
