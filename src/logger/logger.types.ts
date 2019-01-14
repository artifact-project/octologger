import { Output } from '../output/output';
import { LogLevels, LogLevel } from './levels';

export const EntryTypes = {
	entry: 0,
	scope: 1,
}

export type CoreLogger = {
	add(entry: Entry): Entry;
	add(message: string, detail?: any): Entry;
}

export type LoggerAPI = {
	[method:string]: (...args: any[]) => any;
}

export type LoggerOptions = {
	meta: boolean;
	time: boolean;
	levels: LogLevel[];
	silent: boolean;
	storeLast: number;
	output: Output[];
}

export type LoggerEnv = {
	levels: typeof LogLevels;
	logger: CoreLogger;
	createLogEntry: (
		level: Entry['level'],
		badge: Entry['badge'],
		label: Entry['label'],
		message: Entry['message'],
		detail: Entry['detail'],
		meta: EntryMeta,
	) => Entry;
}

export interface Entry {
	cid: number;
	ts: number;
	type: number;
	badge: string;
	level: number;
	label: string;
	message: string;
	detail: any;
	meta: EntryMeta;
	parent: Entry;
	entries: Entry[];
}

export type EntryMeta = {
	fn: string;
	file: string;
	line: number;
	column: number;
}

export const STATE_IDLE = 'idle';
export const STATE_BUSY = 'BUSY';
export const STATE_INTERACTIVE = 'interactive';
export const STATE_PENDING = 'pending';
export const STATE_COMPLETED = 'completed';
export const STATE_ABORTED = 'ABORTED';
export const STATE_CANCELLED = 'cancelled';
export const STATE_FAILED = 'failed';

export type ProcessState = typeof STATE_IDLE
	| typeof STATE_BUSY
	| typeof STATE_INTERACTIVE
	| typeof STATE_PENDING
	| typeof STATE_COMPLETED
	| typeof STATE_ABORTED
	| typeof STATE_CANCELLED
	| typeof STATE_FAILED

export interface ScopeEntry extends Entry {
	detail: {
		info: any;
		state: ProcessState;
	};
}

export type ScopeExecutor<LA extends LoggerAPI, LS extends LoggerScope<LA>> = (scope: LS) => void;
export type LoggerScope<LA extends LoggerAPI> = {
	[K in keyof LA]: LA[K];
} & {
	add(...args: any[]): Entry;

	scope(): ScopeEntry; // current scope

	scope(
		message: string | ScopeEntry,
		executor?: ScopeExecutor<LA, LoggerScope<LA>>,
	): LoggerScope<LA>;

	scope(
		message: string | ScopeEntry,
		detail: any,
		executor?: ScopeExecutor<LA, LoggerScope<LA>>,
	): LoggerScope<LA>;
}

export type Logger<LA extends LoggerAPI> = LoggerScope<LA> & {
	setup: (optionsPatch: Partial<LoggerOptions>) => void;
	add(...args: any[]): Entry;
	print(): void;
	clear(): Entry[];
	getEntries(): Entry[];
	getLastEntry(): Entry;
	getContext(): LoggerContext<LA> | null;
}

export type LoggerContext<LA extends LoggerAPI> = {
	scope: LoggerScope<LA>;
	entry: ScopeEntry;
	logger: CoreLogger;
	options: Partial<LoggerOptions>;
	scopeContext?: LoggerScopeContext;
}

export type LoggerScopeContext = {
	parent: ScopeEntry;
	logger?: CoreLogger;
}

export type ContextSnapshot = {
	activeContext: LoggerContext<any>;
	ctx: LoggerContext<any>;
	scope: LoggerScope<any>;
	scopeContext: LoggerScopeContext;
	scopeContextParent: ScopeEntry;
}
