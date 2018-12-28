import { parseError } from '../error/error';
import { consoleOutput } from '../output/output';
import { LogLevels, LogLevelTypes } from './levels';
import { Entry, EntryTypes, ScopeEntry, LoggerOptions, LoggerAPI, LoggerEnv, Logger, EntryMeta, CoreLogger, LoggerContext, LoggerScope, LoggerScopeContext } from './logger.types';

let cid = 0;

export function isLogEntry(x: any): x is Entry {
	return x && x.hasOwnProperty('type') && x.hasOwnProperty('level');
}

export function createLogEntry(
	level: Entry['level'],
	badge: Entry['badge'],
	label: Entry['label'],
	message: Entry['message'],
	detail: Entry['detail'],
	meta: Entry['meta'] = null,
): Entry {
	return {
		cid: ++cid,
		type: EntryTypes.entry,
		level,
		badge,
		label,
		message,
		detail,
		meta,
		parent: null,
		entries: [],
	};
}

export function getMeta(offset: number = 0): EntryMeta {
	const stack = parseError(new Error).stack;

	if (stack.length <= offset) {
		return null;
	}

	return {
		fn: stack[offset].fn,
		file: stack[offset].file,
		line: stack[offset].line,
		column: stack[offset].column,
	}
}

function createCoreLogger(options: Partial<LoggerOptions>, ctx: LoggerScopeContext) {
	return {
		add(message: string | Entry, detail?: any): Entry {
			const parent = ctx.parent;
			let entry: Entry;

			// console.log(ctx.parent.message);

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

			if (options.meta && entry.meta === null) {
				entry.meta = getMeta(3);
			}

			const length = (entry.parent = parent).entries.push(entry);

			if (length > options.storeLast) {
				parent.entries.splice(0, 1);
			}

			if (options.silent !== true) {
				let idx = options.output.length;
				while (idx--) {
					options.output[idx](entry);
				}
			}

			return entry;
		},
	};
}

export function createScopeEntry(
	level: Entry['level'],
	badge: Entry['badge'],
	label: Entry['label'],
	message: Entry['message'],
	detail: Entry['detail'],
	meta: Entry['meta'] = null,
	state: ScopeEntry['detail']['state'] = null,
): ScopeEntry {
	return {
		cid: ++cid,
		level: level,
		type: EntryTypes.scope,
		badge,
		label,
		parent: null,
		message,
		detail: {
			info: detail,
			state,
		},
		meta,
		entries: [],
	}
}

let _activeContext: LoggerContext<any> = null;

export function getLoggerContext(): LoggerContext<any> {
	return _activeContext;
}

export function switchLoggerContext(ctx: LoggerContext<any>, scope: LoggerScope<any>) {
	if (ctx === null) {
		_activeContext = null;
		return;
	}

	const prev_context = _activeContext;
	const prev_scope = ctx.scope;

	_activeContext = ctx;
	ctx.scope = scope;

	if (ctx.scopeContext) {
		ctx.scopeContext.parent = scope.scope();
	}

	return {
		context: prev_context,
		scope: prev_scope,
	};
}

export function revertLoggerContext(snapshot: {context: LoggerContext<any>, scope: LoggerScope<any>}) {
	switchLoggerContext(snapshot.context, snapshot.scope);
}

export function createLogger<LA extends LoggerAPI>(
	options: Partial<LoggerOptions>,
	factory: (env: LoggerEnv) => LA,
): Logger<LA> {
	if (options.silent == null) {
		options.silent = !/^(file:|https?:\/\/localhost\/)/.test(location + '');
	}

	if (options.meta == null) {
		options.meta = false;
	}

	if (options.storeLast == null) {
		options.storeLast = 1e3;
	}

	if (options.output == null) {
		options.output = [];
	}

	// todo: creation meta
	const root = createScopeEntry(LogLevels.info, '🚧', '#root', null, null);
	const _activeScopeContext: LoggerScopeContext = {
		logger: null,
		parent: root,
	};
	const logger = createCoreLogger(options, _activeScopeContext);

	_activeScopeContext.logger = logger;

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

	// Reserved methods
	['add', 'clear', 'scope', 'setup', 'getEntries', 'getLastEntry'].forEach((name) => {
		if (api.hasOwnProperty(name)) {
			throw new SyntaxError(`[octologger] "${name}" is a reserved identifier`);
		}
	});

	api.print = () => {
		function next(root: Entry & {printed?: boolean}) {
			root.printed = false;
			root.entries.forEach((entry: Entry & {printed?: boolean}) => {
				let idx = options.output.length;
				while (idx--) {
					entry.printed = false;
					options.output[idx](entry);
				}

				if (entry.type === EntryTypes.scope) {
					next(entry);
				}
			});
		}

		next(root);

		// Close all groups
		let idx = options.output.length;
		while (idx--) {
			options.output[idx](null);
		}
	};

	api.add = (...args: any[]) => logger.add(createLogEntry(LogLevels.log, null, null, null, args));
	api.clear = () => root.entries.splice(0, root.entries.length);
	api.setup = setup;
	api.getEntries = () => root.entries;
	api.getLastEntry = () => root.entries[root.entries.length - 1] || null;
	api.scope = function scopeCreator(message: string, detail: any, executor?: Function) {
		if (arguments.length === 0) {
			return (this as any)._scopeEntry;
		}

		if (executor == null && typeof detail === 'function') {
			executor = detail;
			detail = null;
		}

		const scopeEntry = isLogEntry(message) ? message : createScopeEntry(
			LogLevels.info,
			null,
			null,
			message,
			detail,
			options.meta ? getMeta(2) : null,
		);
		_activeScopeContext.logger.add(scopeEntry);

		const logger = createCoreLogger(options, {parent: scopeEntry});
		const scopeAPI = factory({
			setup,
			levels: LogLevels,
			logger,
		});

		scopeAPI.add = (...args: any[]) => logger.add(createLogEntry(LogLevels.log, null, null, null, args));
		scopeAPI.scope = scopeCreator;
		(scopeAPI as any)._scopeEntry = scopeEntry;

		// Переключаем scope
		if (typeof executor === 'function') {
			const prev_activeContext = _activeContext;
			const prev_parentEntry = _activeScopeContext.parent;
			const prev_parentLogger = _activeScopeContext.logger;

			_activeContext = {
				entry: scopeEntry,
				scope: scopeAPI as LoggerScope<LA>,
				logger,
				options,
				scopeContext: _activeScopeContext
			};

			_activeScopeContext.parent = scopeEntry;

			executor(scopeAPI);

			_activeContext = prev_activeContext;

			_activeScopeContext.parent = prev_parentEntry;
			_activeScopeContext.logger = prev_parentLogger;
		}

		return scopeAPI;
	};

	return api as Logger<LA>;
}

const BADGES: {[K in LogLevelTypes]?: string} = {
	info: '❕',
	warn: '⚠️',
	error: '🛑',
	verbose: '🔎',
	debug: '⁉️',
};

const octologger = createLogger({
	meta: true,
	output: [consoleOutput()],
}, ({
	levels,
	logger,
}) => Object.keys(levels).reduce((api, level) => {
	api[level] = (...args: any[]) => {
		logger.add(createLogEntry(levels[level], BADGES[level] || null, null, null, args));
	};

	return api;
}, {}) as {
	[K in (keyof typeof levels)]: (...args: any[]) => void;
});

export {
	octologger,
	octologger as logger,
	octologger as default,
};
