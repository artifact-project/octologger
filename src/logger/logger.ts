import { parseError } from '../error/error';
import { Output, consoleOutput } from '../output/output';
import { LogLevels } from './levels';
import { Entry, EntryTypes } from './entry';

export type CoreLogger = {
	add(entry: Entry): Entry;
	add(label: string, detail?: any): Entry;
}

export type LoggerAPI = {
	[method:string]: (...args: any[]) => any;
}

export type LoggerOptions = {
	meta: boolean;
	storeLast: number;
	output: Output[];
}

export type LoggerEnv = {
	setup: (optionsPatch: Partial<LoggerOptions>) => void;
	levels: typeof LogLevels;
	logger: CoreLogger;
}

export function isLogEntry(x: any): x is Entry {
	return x && x.hasOwnProperty('type') && x.hasOwnProperty('level');
}

export function createLogEntry(
	level: Entry['level'],
	badge: Entry['badge'],
	label: Entry['label'],
	message: Entry['message'],
	detail: Entry['detail'],
): Entry {
	return {
		type: EntryTypes.entry,
		level,
		badge,
		label,
		message,
		detail,
		meta: null,
		parent: null,
		entries: [],
	} as Entry;
}

export type ScopeExecutor<LA extends LoggerAPI, LS extends LoggerScope<LA>> = (scope: LS) => void;
export type LoggerScope<LA extends LoggerAPI> = {
	[K in keyof LA]: LA[K];
} & {
	scope(): Entry; // current scope

	scope(
		label: string,
		executor: ScopeExecutor<LA, LoggerScope<LA>>,
	): LoggerScope<LA>;

	scope(
		label: string,
		detail: any,
		executor: ScopeExecutor<LA, LoggerScope<LA>>,
	): LoggerScope<LA>;
}

export type Logger<LA extends LoggerAPI> = LoggerScope<LA> & {
	setup: LoggerEnv['setup'];
	clear(): Entry[];
	getEntries(): Entry[];
	getLastEntry(): Entry;
}

export function getMeta(offset:number = 0): Entry['meta'] {
	const stack = parseError(new Error).stack;

	if (stack.length < offset) {
		return null;
	}

	return {
		fn: stack[offset].fn,
		file: stack[offset].file,
		line: stack[offset].line,
		column: stack[offset].column,
	}
}

function createCoreLogger(options: LoggerOptions, parent: Entry) {
	return {
		add(message: string | Entry, detail?: any): Entry {
			let entry: Entry;

			if (isLogEntry(message)) {
				entry = message;
			} else {
				entry = createLogEntry(
					LogLevels.log,
					null,
					null,
					message,
					detail,
				);
			}

			if (options.meta) {
				entry.meta = getMeta(3);
			}

			entry.parent = parent;
			const length = parent.entries.push(entry);

			if (length > options.storeLast) {
				parent.entries.splice(0, 1);
			}

			let idx = options.output.length;
			while (idx--) {
				options.output[idx](entry);
			}

			return entry;
		},
	};
}

export function createLogger<LA extends LoggerAPI>(factory: (env: LoggerEnv) => LA) {
	function createScopeEntry(label: string) {
		return {
			level: LogLevels.info,
			type: EntryTypes.scope,
			badge: null,
			label,
			parent: null,
			message: null,
			detail: {
				args: null,
				tasks: [],
				pending: false,
				passed: 0,
				failed: 0,
			},
			meta: options.meta ? getMeta() : null,
			entries: [],
		}
	}

	const options: LoggerOptions = {
		meta: false,
		storeLast: 1e3,
		output: [],
	};

	const root: Entry = createScopeEntry('#root');
	const logger = createCoreLogger(options, root);

	const setup = (optionsPatch: Partial<LoggerOptions>) => {
		for (let key in optionsPatch) {
			if (optionsPatch.hasOwnProperty(key)) {
				options[key] = optionsPatch[key];
			}
		}
	};

	const api = factory({
		setup,
		levels: LogLevels,
		logger,
	});

	let currentScope = root;

	['clear', 'scope', 'setup', 'getEntries', 'getLastEntry'].forEach((name) => {
		if (api.hasOwnProperty(name)) {
			throw new SyntaxError(`[octologger] "${name}" is a reserved identifier`);
		}
	});

	api.clear = () => root.entries.splice(0, root.entries.length);
	api.setup = setup;
	api.getEntries = () => root.entries;
	api.getLastEntry = () => root.entries[root.entries.length - 1] || null;
	api.scope = function scopeCreator(label: string, detail: any, executor?: Function) {
		if (arguments.length === 0) {
			return currentScope;
		}

		if (executor == null && typeof detail === 'function') {
			executor = detail;
			detail = null;
		}

		const scopeEntry = createScopeEntry(label);
		const scopeAPI = factory({
			setup,
			levels: LogLevels,
			logger: createCoreLogger(options, scopeEntry),
		});

		scopeAPI.scope = scopeCreator;

		// Переключаем scope
		if (typeof executor === 'function') {
			let _currentScope = currentScope;
			currentScope = scopeEntry;
			executor(scopeAPI);
			currentScope = _currentScope; // возвращаем scope
		}

		return scopeAPI;
	};

	return api as Logger<LA>;
}

const octlogger = createLogger(({
	setup,
	levels,
	logger,
}) => {
	setup({
		meta: true,
		output: [consoleOutput()],
	});

	return Object.keys(levels).reduce((api, level) => {
		api[level] = (...args: any[]) => {
			logger.add(createLogEntry(levels[level], null, null, null, args));
		};

		return api;
	}, {}) as {
		[K in (keyof typeof levels)]: (...args: any[]) => void;
	}
});

export {
	octlogger,
	octlogger as default,
};
