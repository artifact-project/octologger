import { parseError } from './error';

it('error', () => {
	const error = new TypeError('foo');

	expect(parseError(error).name).toBe(error.name);
	expect(parseError(error).message).toBe(error.message);
	expect(parseError(error).stack.length).toBeGreaterThan(1);
});