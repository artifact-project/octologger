import { browserFormat as format } from './format';
import { createLogger, createLogEntry } from '../logger/logger';
import { LogLevels } from '../logger/levels';
import { Entry } from '../logger/logger.types';

const logger = createLogger({}, ({logger}) => ({
	log: (entry: Entry) => logger.add(entry),
}));

it('badge', () => {
	let entry = logger.log(createLogEntry(LogLevels.log, 'x', null, null, null));
	expect(format(entry)).toEqual(["%s", "x"]);
});

it('label', () => {
	let entry = logger.log(createLogEntry(LogLevels.log, null, 'success', null, null));
	expect(format(entry)).toEqual(["%c%s%c ", "text-decoration: underline;", "success", "text-decoration: inherit;"]);
});

it('message', () => {
	let entry = logger.log(createLogEntry(LogLevels.error, null, null, 'Wow!', null));
	expect(format(entry)).toEqual(["%c%s ", "color: red;", "Wow!"]);

	entry = logger.log(createLogEntry(LogLevels.log, null, null, 'Wow!', null));
	expect(format(entry)).toEqual(["%c%s ", "color: #333;", "Wow!"]);

	entry = logger.log(createLogEntry(LogLevels.info, null, null, 'Wow!', null));
	expect(format(entry)).toEqual(["%c%s ", "color: dodgerblue;", "Wow!"]);
});

it('detail', () => {
	let entry = logger.log(createLogEntry(LogLevels.log, null, null, null, 123));
	expect(format(entry)).toEqual(["%o ", 123]);
});

it('all', () => {
	let entry = logger.log(createLogEntry(LogLevels.log, '!', 'notice', 'user email', 'ibn@rubaxa.org'));
	expect(format(entry)).toEqual(["%s%c%s%c %c%s %o ", "!", "text-decoration: underline;", "notice", "text-decoration: inherit;", "color: #333;", "user email", "ibn@rubaxa.org"]);
});
