import logger from '../logger/logger';
import { globalThis } from '../utils/utils';
import { patchPromise, revertPatchPromise } from '../patcher/patcher';
import { ScopedPromise } from './promise';
import { STATE_PENDING, STATE_RESOLVED, STATE_REJECTED, STATE_ERROR, STATE_OK } from '../logger/logger.types';
import { NativePromise } from '../patcher/native';

beforeAll(() => {
	logger.setup({output: []});
	patchPromise(globalThis);
});

afterAll(() => {
	revertPatchPromise(globalThis);
});

it('native', () => {
	expect(globalThis.Promise + '').toBe('function Promise() { [native code] }');
});

describe('ScopedPromise', () => {
	const Promise = ScopedPromise;

	describe('Without Scope', () => {
		it('resolve', async () => {
			await new Promise(resolve => resolve());
		});
	});

	describe('With Scope', () => {
		it('resolve', async () => {
			let promise: Promise<object>;
			let scope = logger.scope('json', () => {
				promise = new Promise(resolve => {
					logger.verbose('in promise');
					setTimeout(() => {
						resolve({foo: 'bar'});
					});
				});
			}).scope();

			expect(scope.entries.length).toEqual(1);
			expect(scope.entries[0].detail.state).toEqual(STATE_PENDING);

			await promise;

			expect(scope.entries[0].detail.state).toEqual(STATE_RESOLVED);
			expect(scope.entries[0].detail.info.result).toEqual({foo: 'bar'});

			expect(scope.entries[0].entries.length).toEqual(2);
			expect(scope.entries[0].entries[0].detail).toEqual(['in promise']);

			expect(scope.entries[0].entries[1].message).toEqual('[[Promise.then.onFulfilled]]');
			expect(scope.entries[0].entries[1].detail.state).toEqual('resolved');
			expect(scope.entries[0].entries[1].detail.info).toEqual({error: undefined, result: undefined});
		});

		it('reject', async () => {
			let reason = new Error('NO DATA');
			let promise: Promise<object>;
			let scope = logger.scope('json', () => {
				promise = new Promise((_, reject) => {
					logger.verbose('in promise');
					setTimeout(() => {
						reject(reason);
					});
				});
			}).scope();

			expect(scope.entries.length).toEqual(1);
			expect(scope.entries[0].detail.state).toEqual(STATE_PENDING);

			try {
				await promise;
			} catch (err) {
				expect(err).toBe(reason);
			}

			expect(scope.entries[0].detail.state).toEqual(STATE_REJECTED);
			expect(scope.entries[0].detail.info.reason).toEqual(reason);

			expect(scope.entries[0].entries.length).toEqual(2);
			expect(scope.entries[0].entries[0].detail).toEqual(['in promise']);

			expect(scope.entries[0].entries[1].message).toEqual('[[Promise.then.onRejected]]');
			expect(scope.entries[0].entries[1].detail.state).toEqual('resolved');
			expect(scope.entries[0].entries[1].detail.info).toEqual({error: undefined, result: undefined});
		});

		it('error in executer', async () => {
			let error = new Error('ERR');
			let promise: Promise<object>;
			let scope = logger.scope('json', () => {
				promise = new Promise(() => {
					logger.verbose('in promise');
					throw error
				});
			}).scope();

			expect(scope.entries.length).toEqual(1);
			expect(scope.entries[0].detail.state).toEqual(STATE_ERROR);

			try {
				await promise;
			} catch (err) {
				expect(err).toBe(error);
			}

			expect(scope.entries[0].detail.state).toEqual(STATE_ERROR);
			expect(scope.entries[0].detail.info.error).toEqual(error);

			expect(scope.entries[0].entries.length).toEqual(2);
			expect(scope.entries[0].entries[0].detail).toEqual(['in promise']);

			expect(scope.entries[0].entries[1].message).toEqual('[[Promise.then.onRejected]]');
			expect(scope.entries[0].entries[1].detail.state).toEqual('resolved');
			expect(scope.entries[0].entries[1].detail.info).toEqual({error: undefined, result: undefined});
		});

		it('then -> resolve', async () => {
			let promise: Promise<number>;
			let scope = logger.scope('json', () => {
				promise = new Promise((resolve) => {
					resolve(2);
				});
			}).scope();

			const val = await promise.then(val => {
				logger.success('wow!');
				return val * 3;
			});

			expect(val).toEqual(val);
			expect(scope.entries[0].detail.state).toEqual(STATE_RESOLVED);
			expect(scope.entries[0].detail.info.result).toEqual(2);

			expect(scope.entries[0].entries[0].message).toEqual('[[Promise.then.onFulfilled]]');
			expect(scope.entries[0].entries[0].detail.state).toEqual(STATE_RESOLVED);
			expect(scope.entries[0].entries[0].detail.info.result).toEqual(6);

			expect(scope.entries[0].entries[0].entries[0].detail).toEqual(['wow!']);
		});
	});
});