import { Output } from '../output/output';
import { LogLevels } from './levels';

export const EntryTypes = {
	entry: 0,
	scope: 1,
	group: 2,
	timeMark: 3,
	timeMeasure: 4,
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
	silent: boolean;
	storeLast: number;
	output: Output[];
}

export type LoggerEnv = {
	setup: (optionsPatch: Partial<LoggerOptions>) => void;
	levels: typeof LogLevels;
	logger: CoreLogger;
}

export interface Entry {
	cid: number;
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

export interface ScopeEntry extends Entry {
	detail: {
		info: any;
		state: 'idle' | 'pending' | 'completed' | 'cancelled' | 'failed';
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
	setup: LoggerEnv['setup'];
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