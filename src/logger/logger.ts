import { Entry, ScopeEntry, LoggerOptions, LoggerAPI, LoggerFactoryAPI, Logger, LoggerContext, LoggerScope, LoggerScopeContext, ContextSnapshot, EntryMeta, ScopeExecutor, SCOPE, ENTRY } from './logger.types';
import { universalOutput } from '../output/output';
import { now } from '../utils/utils';

const time = new Date();
let cid = 0;

type CompactMetaArg = [string, number, number];

function isMeta(arg: any): arg is CompactMetaArg {
	return arg && arg.length === 3 && arg[0] && arg[1] > 0 && arg[2] > 0;
}

function toMeta(arg: CompactMetaArg): EntryMeta {
	return {file: arg[0], line: arg[1], col: arg[2]};
}

export function isLogEntry(x: any): x is Entry {
	return x && x.type !== void 0 && x.level !== void 0;
}

export function createEntry(
	level: Entry['level'],
	badge: Entry['badge'],
	label: Entry['label'],
	message: Entry['message'],
	detail: Entry['detail'],
): Entry {
	return {
		cid: ++cid,
		ts: 0,
		type: ENTRY,
		level,
		badge,
		label,
		message,
		detail,
		meta: null,
		parent: null,
		entries: [],
	};
}

export function createScopeEntry(
	level: Entry['level'],
	badge: Entry['badge'],
	label: Entry['label'],
	message: Entry['message'],
	detail: Entry['detail'],
): ScopeEntry {
	return {
		cid: ++cid,
		ts: 0,
		level: level,
		type: SCOPE,
		badge,
		label,
		parent: null,
		message,
		detail,
		meta: null,
		entries: [],
	}
}

let _activeContext: LoggerContext<any> | null = null;

export function getLoggerContext(): LoggerContext<any> | null {
	return _activeContext;
}

export function switchLoggerContext(ctx: LoggerContext<any>, scope: LoggerScope<any>): ContextSnapshot | null {
	if (ctx === null) {
		_activeContext = null;
		return null;
	}

	const prev_activeContext = _activeContext;
	const prev_scope = ctx.scope;
	const prev_scopeContext = ctx.scopeContext;
	let prev_scopeContextParent: ScopeEntry | null = null;

	_activeContext = ctx;
	ctx.scope = scope;

	if (ctx.scopeContext) {
		prev_scopeContextParent = ctx.scopeContext.parent;
		ctx.scopeContext.parent = scope.scope();
	}

	return {
		activeContext: prev_activeContext,
		ctx,
		scope: prev_scope,
		scopeContext: prev_scopeContext,
		scopeContextParent: prev_scopeContextParent,
	};
}

export function revertLoggerContext(snapshot: ContextSnapshot) {
	const {
		ctx,
		scopeContext,
	} = snapshot;

	ctx.scope = snapshot.scope;
	ctx.scopeContext = scopeContext;

	if (scopeContext) {
		scopeContext.parent = snapshot.scopeContextParent;
	}

	_activeContext = snapshot.activeContext;
}

export function createLogger<LA extends LoggerAPI>(
	options: Partial<LoggerOptions>,
	factory: (api: LoggerFactoryAPI) => LA,
): Logger<LA> {
	const createCoreLogger = (ctx: LoggerScopeContext) => ({
		add(message: string | Entry, detail?: any): Entry {
			let entry: Entry;

			if (isLogEntry(message)) {
				entry = message;
			} else {
				entry = createEntry(
					'log',
					null,
					null,
					message,
					detail,
				);
			}

			const {detail:args} = entry;

			if (args && args.length && isMeta(args[0])) {
				entry.meta = toMeta(args.shift());
			}

			if (options.time) {
				entry.ts = now();
			}

			const parent = ctx.parent;
			
			if (parent) {
				const length = (entry.parent = parent).entries.push(entry);
				
				if (length > options.storeLast!) {
					parent.entries.splice(0, 1);
				}
			}

			if (options.silent !== true && options.output) {
				options.output(entry);
			}

			return entry;
		},
	});
	const root = createScopeEntry('info', '🚧', '#root', 'root', {
		time,
		created: new Date(),
	});
	const _activeScopeContext: LoggerScopeContext = {
		logger: null,
		parent: root,
	};
	const logger = createCoreLogger(_activeScopeContext);
	const api = factory({
		createEntry,
		logger,
	}) as Logger<LA> & {
		m: EntryMeta | null;
	};

	if (options.silent == null && typeof location !== 'undefined') {
		options.silent = !/^(about:|file:|https?:\/\/localhost\/)/.test(location + '');
	}

	if (options.time == null) {
		options.time = true;
	}

	if (options.storeLast == null) {
		options.storeLast = 1e3;
	}

	_activeScopeContext.logger = logger;

	// Reserved methods
	['add', 'clear', 'scope', 'setup', 'entries', 'last', 'priny', 'm'].forEach((name) => {
		if (api.hasOwnProperty(name)) {
			throw new Error(`[octoLogger] "${name}" is a reserved identifier`);
		}
	});

	api.print = () => {
		function next(root: Entry & {printed?: boolean}) {
			root.printed = false;
			root.entries.forEach((entry: Entry & {printed?: boolean}) => {
				entry.printed = false;
				options.output && options.output(entry);

				if (entry.type === SCOPE) {
					next(entry);
				}
			});
		}

		next(root);

		// Close all groups
		options.output && options.output(null);
	};

	api.add = (...args: any[]) => logger.add(createEntry('log', null, null, null, args));
	api.clear = () => root.entries.splice(0, root.entries.length);
	api.setup = (optionsPatch: Partial<LoggerOptions>) => {
		for (let key in optionsPatch) {
			if (optionsPatch.hasOwnProperty(key)) {
				options[key] = optionsPatch[key];
			}
		}
	};
	api.entries = () => root.entries;
	api.last = () => root.entries[root.entries.length - 1] || null;
	api.scope = function scopeCreator(
		this: Logger<LA>,
		message?: string | Entry,
		detail?: any,
		executor?: ScopeExecutor<LA, LoggerScope<LA>>,
	) {
		const args = arguments;
		let meta: EntryMeta | null = null;

		if (args.length === 0) {
			return (this as any)._scopeEntry;
		}
		
		const firstArg = args[0];
		if (isMeta(firstArg)) {
			meta = toMeta(firstArg);
			message = args[1];
			detail = args[2];
			executor = args[3];
		}

		if (executor == null && typeof detail === 'function') {
			executor = detail;
			detail = null;
		}

		const scopeEntry = isLogEntry(message) ? message : createScopeEntry(
			'info',
			null,
			null,
			message,
			detail,
		);
		
		scopeEntry.meta = meta;
		_activeScopeContext.logger!.add(scopeEntry);

		const logger = createCoreLogger({parent: scopeEntry, logger: null});
		const scopeAPI: any = factory({
			createEntry,
			logger,
		});

		scopeAPI.add = (...args: any[]) => logger.add(createEntry('log', null, null, null, args));
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

	return api;
}

const BADGES = {
	log: null,
	info: '❕',
	done: '✅',
	warn: '⚠️',
	error: '🛑',
	verbose: '🔎',
};

export const logger = createLogger({
	output: universalOutput(),
}, ({logger}) => Object.keys(BADGES).reduce((api, level) => {
	api[level] = (...args: any[]) => {
		logger.add(createEntry(level, BADGES[level] || null, null, null, args));
	};

	return api;
}, {}) as {
	[K in (keyof typeof BADGES)]: (...args: any[]) => void;
});
