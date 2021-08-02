import { browserFormat as format } from './format';
import { createLogger, createEntry } from '../logger/logger';
import { Entry } from '../logger/logger.types';

const logger = createLogger({
	time: false,
}, ({logger}) => ({
	log: (entry: Entry) => logger.add(entry),
}));

it('badge', () => {
	let entry = logger.log(createEntry('log', 'x', null, null, null));
	expect(format(entry)).toEqual(['%s', 'x']);
});

it('label', () => {
	let entry = logger.log(createEntry('log', null, 'success', null, null));
	expect(format(entry)).toEqual([
		'%c%s%c ',
		'text-decoration: underline; font-weight: bold;color: #333;',
		'success',
		'text-decoration: inherit; font-weight: inherit;',
	]);
});

it('message', () => {
	let entry = logger.log(createEntry('error', null, null, 'Wow!', null));
	expect(format(entry)).toEqual(['%c%s ', 'color: red;', 'Wow!']);

	entry = logger.log(createEntry('log', null, null, 'Wow!', null));
	expect(format(entry)).toEqual(['%c%s ', 'color: #333;', 'Wow!']);

	entry = logger.log(createEntry('info', null, null, 'Wow!', null));
	expect(format(entry)).toEqual(['%c%s ', 'color: dodgerblue;', 'Wow!']);
});

it('detail', () => {
	let entry = logger.log(createEntry('log', null, null, null, 123));
	expect(format(entry)).toEqual(['%o ', 123]);
});

it('all', () => {
	let entry = logger.log(createEntry('log', '!', 'notice', 'user email', 'ibn@rubaxa.org'));
	expect(format(entry)).toEqual([
		'%s%c%s%c %c%s %o ',
		'!',
		'text-decoration: underline; font-weight: bold;color: #333;',
		'notice',
		'text-decoration: inherit; font-weight: inherit;',
		'color: #333;',
		'user email',
		'ibn@rubaxa.org',
	]);
});
