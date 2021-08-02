import { Output } from '../output/output';

export const ENTRY = 1;
export const SCOPE = 2;

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
	silent: boolean;
	storeLast: number;
	output: Output | null;
}

export type LoggerFactoryAPI = {
	logger: CoreLogger;
	createEntry: (
		level: Entry['level'],
		badge: Entry['badge'],
		label: Entry['label'],
		message: Entry['message'],
		detail: Entry['detail'],
	) => Entry;
}

export interface Entry {
	cid: number;
	ts: number;
	type: number;
	level: string;
	badge: string | null;
	label: string | null;
	message?: string | null;
	detail: any;
	meta: EntryMeta | null;
	parent: Entry | null;
	entries: Entry[];
}

export type EntryMeta = {
	file: string;
	line: number;
	col: number;
}

export interface ScopeEntry extends Entry {
}

type OctoShell<T>= T & {__octoret__?: never};

export type OctoMethod<T extends (...args: any[]) => any> = T extends (...args: infer A) => infer R
	? (...args: A) => OctoShell<R>
	: OctoShell<T>

export type ScopeExecutor<LA extends LoggerAPI, LS extends LoggerScope<LA>> = (scope: LS) => void;

export type LoggerScope<LA extends LoggerAPI> = {
	[K in keyof LA]: OctoMethod<LA[K]>;
} & {
	add: OctoMethod<(...args: any[]) => Entry>;

	scope(): ScopeEntry; // current scope

	scope(
		message: string | ScopeEntry,
		executor?: ScopeExecutor<LA, LoggerScope<LA>>,
	): OctoShell<LoggerScope<LA>>;

	scope(
		message: string | ScopeEntry,
		detail: any,
		executor?: ScopeExecutor<LA, LoggerScope<LA>>,
	): OctoShell<LoggerScope<LA>>;
}

export type Logger<LA extends LoggerAPI> = LoggerScope<LA> & {
	setup: (optionsPatch: Partial<LoggerOptions>) => void;
	print(): void;
	clear(): Entry[];
	entries(): Entry[];
	last(): Entry;
	// context(): LoggerContext<LA> | null;
}

export type LoggerContext<LA extends LoggerAPI> = {
	scope: LoggerScope<LA>;
	entry: ScopeEntry;
	logger: CoreLogger;
	options: Partial<LoggerOptions>;
	scopeContext: LoggerScopeContext | null;
}

export type LoggerScopeContext = {
	parent: ScopeEntry | null;
	logger: CoreLogger | null;
}

export type ContextSnapshot = {
	activeContext: LoggerContext<any> | null;
	ctx: LoggerContext<any>;
	scope: LoggerScope<any>;
	scopeContext: LoggerScopeContext | null;
	scopeContextParent: ScopeEntry | null;
}

// export type LiteralUnion<
// 	LiteralType,
// 	BaseType extends Primitive
// > = LiteralType | (BaseType & {_?: never});

// export type BaseLogLevels = 
// 	| 'log'
// 	| 'info'
// 	| 'warn'
// 	| 'error'
// 	| 'verbose'
// ;
