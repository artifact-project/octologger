import logger, { getLoggerContext } from '../logger/logger';
import { globalThis, pause } from '../utils/utils';
import { revertPatchTimers, patchTimers } from '../patcher/patcher';
import { XError, parseError } from '../error/error';
import { LogLevels } from '../logger/levels';

beforeAll(() => {
	logger.setup({output: []});
	patchTimers(globalThis);
});

afterAll(() => {
	revertPatchTimers(globalThis);
});

it('native', () => {
	expect(globalThis.setTimeout + '').toBe('function setTimeout() { [native code] }');
	expect(!!globalThis.setTimeout['native']).toBe(true);
});

describe('setTimeout', () => {
	it('context and parent', async () => {
		const parent = logger.add('before').parent;

		expect(parent.label).toBe('#root');

		logger.scope('sleep', function scopeSleep() {
			setTimeout(() => {
				logger.info('WOW!');
			}, 1);
		});

		await pause(1);
		expect(getLoggerContext()).toBe(null);
		expect(logger.add('after').parent).toBe(parent);
	});

	it('successfully', async function setTimeoutTest() {
		let pid: any;
		let timerMeta: XError;
		let logMeta: XError;
		const scope = logger.scope('sleep', function scopeSleep() {
			timerMeta = parseError(new Error);
			pid = setTimeout(function sleepCallback() {
				logMeta = parseError(new Error);
				logger.info('WOW!');
			}, 1);
		});

		expect(scope.scope().entries.length).toEqual(1);
		expect(scope.scope().entries[0].message).toEqual('Timer "setTimeout" started');
		expect(scope.scope().entries[0].detail.info.delay).toEqual(1);
		expect(scope.scope().entries[0].detail.info.pid).toEqual(pid);
		expect(scope.scope().entries[0].detail.state).toEqual('idle');
		expect(scope.scope().entries[0].meta.file).toEqual(timerMeta.file);
		expect(scope.scope().entries[0].meta.line).toEqual(timerMeta.line + 1);
		expect(scope.scope().entries[0].meta.fn).toEqual('scopeSleep');
		await pause(1);

		expect(scope.scope().entries[0].detail.state).toEqual('completed');

		const timerScope = scope.scope().entries[0];
		expect(timerScope.entries.length).toEqual(2);

		expect(timerScope.entries[0].detail).toEqual(['WOW!']);
		expect(timerScope.entries[0].meta.line).toEqual(logMeta.line + 1);
		expect(timerScope.entries[0].meta.fn).toEqual('sleepCallback');

		expect(timerScope.entries[1].level).toEqual(LogLevels.info);
		expect(timerScope.entries[1].message).toEqual('Timer "setTimeout" completed successfully');
		expect(timerScope.entries[1].detail.cancelled).toEqual(false);
	});

	it('cancelled', async function setTimeoutTest() {
		let pid: any;
		let notCancelled = false;
		const scope = logger.scope('sleep', function scopeSleep() {
			pid = setTimeout(function sleepCallback() {
				notCancelled = true;
			}, 2);
		});

		expect(scope.scope().entries.length).toEqual(1);
		expect(scope.scope().entries[0].detail.state).toEqual('idle');

		clearTimeout(pid);
		expect(scope.scope().entries[0].detail.state).toEqual('cancelled');
		expect(scope.scope().entries[0].entries[0].message).toEqual('Timer "setTimeout" cancelled');
		expect(scope.scope().entries[0].entries[0].detail.cancelled).toEqual(true);

		await pause(3);

		expect(notCancelled).toBe(false);
	});


	it('error in callback (failed)', async function setTimeoutTest() {
		let err = new Error('FAIL');
		let consoleErr: Error;
		const scope = logger.scope('sleep', function scopeSleep() {
			setTimeout(function sleepCallback() {
				throw err;
			}, 2);
		});

		const originalConsoleErr = console.error;
		console.error = (err: Error) => {
			consoleErr = err;
		};

		expect(scope.scope().entries.length).toEqual(1);
		expect(scope.scope().entries[0].detail.state).toEqual('idle');

		await pause(3);

		expect(scope.scope().entries[0].detail.state).toEqual('failed');
		expect(scope.scope().entries[0].entries[0].message).toEqual('Timer "setTimeout" failed');
		expect(scope.scope().entries[0].entries[0].detail.error).toBe(err);
		expect(scope.scope().entries[0].entries[0].detail.cancelled).toEqual(false);
		expect(consoleErr).toBe(err);
		console.error = originalConsoleErr;
	});
});