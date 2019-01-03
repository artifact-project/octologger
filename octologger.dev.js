(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.octologger = {})));
}(this, (function (exports) { 'use strict';

	var EntryTypes = {
	    entry: 0,
	    scope: 1,
	    group: 2,
	    timeMark: 3,
	    timeMeasure: 4,
	};

	var LogLevels = {
	    error: 0,
	    warn: 1,
	    info: 2,
	    verbose: 3,
	    debug: 4,
	    log: 5,
	    success: 6,
	};
	var LogLevelsInvert = {};
	for (var key in LogLevels) {
	    LogLevelsInvert[LogLevels[key]] = key;
	}

	var R_VALUE = /:([^;]+)/g;
	function createFormat(styles, format) {
	    return function (entry) {
	        var level = LogLevelsInvert[entry.level];
	        return format(level, entry, {
	            base: styles.level[level],
	            label: styles.label[level],
	        });
	    };
	}
	var nodeFromat = createFormat({
	    level: {
	        error: '\x1b[31m',
	        warn: '\x1b[33m',
	        log: '\x1b[0m',
	        info: '\x1b[34m',
	        success: '\x1b[34m',
	        verbose: '\x1b[35m',
	        debug: '\x1b[35m',
	    },
	    label: {
	        error: '\x1b[4m',
	        warn: '\x1b[4m',
	        log: '\x1b[4m',
	        info: '\x1b[4m',
	        success: '\x1b[4m',
	        verbose: '\x1b[4m',
	        debug: '\x1b[4m',
	        silly: '\x1b[4m',
	    },
	}, function (_, entry, style) {
	    var args = [];
	    if (entry.badge !== null) {
	        args.push(entry.badge);
	    }
	    if (entry.label !== null) {
	        args.push("" + style.base + style.label + entry.label + "\u001B[0m");
	    }
	    if (entry.message !== null) {
	        args.push("" + style.base + entry.message);
	    }
	    if (entry.detail !== null) {
	        args.push(entry.detail);
	    }
	    if (entry.meta !== null) {
	        args.push(entry.meta.file + ":" + entry.meta.line + ":" + entry.meta.column + " (" + entry.meta.fn + ")");
	    }
	    args.push('\x1b[0m');
	    return args;
	});
	var LABEL_STYLE = 'text-decoration: underline; font-weight: bold;';
	var browserFormat = createFormat({
	    level: {
	        error: 'color: red;',
	        warn: 'color: orange;',
	        log: 'color: #333;',
	        success: 'color: #1aaa55;',
	        info: 'color: dodgerblue;',
	        verbose: 'color: magenta;',
	        debug: 'color: #8b1fdd;',
	    },
	    label: {
	        error: LABEL_STYLE,
	        warn: LABEL_STYLE,
	        log: LABEL_STYLE,
	        info: LABEL_STYLE,
	        success: LABEL_STYLE,
	        verbose: LABEL_STYLE,
	        debug: LABEL_STYLE,
	        silly: LABEL_STYLE,
	    },
	}, function (_, entry, style) {
	    var fmt = [];
	    var args = [];
	    if (entry.badge !== null) {
	        fmt.push('%s');
	        args.push(entry.badge);
	    }
	    if (entry.label !== null) {
	        fmt.push('%c%s%c ');
	        args.push(style.label + style.base, entry.label, style.label.replace(R_VALUE, ': inherit'));
	    }
	    if (entry.message !== null) {
	        fmt.push('%c%s ');
	        args.push(style.base, entry.message);
	    }
	    if (entry.detail != null) {
	        var detail = entry.detail;
	        var n = detail.length;
	        if (entry.message === null && n >= 0 && (0 in detail)) {
	            fmt.push('%c');
	            args.push(style.base);
	            for (var i = 0; i < n; i++) {
	                var val = detail[i];
	                fmt.push((typeof val === 'string' ? '%s' : '%o') + " ");
	                args.push(val);
	            }
	        }
	        else {
	            fmt.push('%o ');
	            args.push(detail);
	        }
	    }
	    if (entry.meta !== null) {
	        fmt.push('%s');
	        args.push(entry.meta.file + ":" + entry.meta.line + ":" + entry.meta.column + " (" + entry.meta.fn + ")");
	    }
	    args.unshift(fmt.join(''));
	    return args;
	});

	var globalThis = Function('return this')();
	var now = typeof performance !== 'undefined' && performance.now
	    ? function () { return performance.now(); }
	    : Date.now;

	var nativeAPI = {
	    console: globalThis.console,
	};
	var timersList = [
	    'Timeout',
	    'Interval',
	    'Immediate',
	    'AnimationFrame',
	];
	function eachTimers(scope, iterator) {
	    timersList.forEach(function (name) {
	        var isRAF = name === 'AnimationFrame';
	        var setName = "" + (isRAF ? 'request' : 'set') + name;
	        var cancelName = "" + (isRAF ? 'cancel' : 'clear') + name;
	        iterator(isRAF, setName, scope[setName], cancelName, scope[cancelName]);
	    });
	}
	// Save origins
	eachTimers(globalThis, function (_, setName, setFn, cancelName, cancelFn) {
	    nativeAPI[setName] = setFn;
	    nativeAPI[cancelName] = cancelFn;
	});

	var originalConsole = typeof console !== 'undefined' && console.log ? console : null;
	var nodeOutput = function (console) {
	    if (console === void 0) { console = originalConsole; }
	    return function (entry) {
	        if (entry === null) {
	            return;
	        }
	        var fn = LogLevelsInvert[entry.level === 6 ? LogLevels.info : entry.level];
	        console[fn].apply(console, nodeFromat(entry));
	    };
	};
	var browserOutput = function (console) {
	    if (console === void 0) { console = originalConsole; }
	    var log = console.log.apply
	        ? console.log
	        : Function.prototype.bind.call(console.log, console);
	    var groupSupproted = !!console.group;
	    var groupEndSupproted = !!console.groupEnd;
	    var groupCollapsedSupproted = !!console.groupCollapsed;
	    var setTimeout = nativeAPI.setTimeout;
	    var debounced = {};
	    var openScopes = [];
	    function print(entry, skipPrinted) {
	        if (entry === null) {
	            openScopes.forEach(function () {
	                console.groupEnd();
	            });
	            openScopes.length = 0;
	            return;
	        }
	        var parent = entry.parent;
	        var opened = openScopes.length;
	        if (skipPrinted && entry.printed) {
	            return;
	        }
	        if (opened > 0) {
	            var idx = opened;
	            while (idx--) {
	                if (openScopes[idx] === parent) {
	                    break;
	                }
	                else {
	                    openScopes[idx].printed = true;
	                    console.groupEnd();
	                }
	            }
	            openScopes.length = idx + 1;
	        }
	        if (entry.type === EntryTypes.scope) {
	            if (entry.detail.state === 'idle') {
	                entry.printed = true;
	                log.apply(console, browserFormat(entry));
	            }
	            else {
	                openScopes.push(entry);
	                console.group.apply(console, browserFormat(entry));
	            }
	        }
	        else {
	            if (!skipPrinted && parent.printed && parent.label !== '#root') {
	                debounced[parent.cid] || (debounced[parent.cid] = setTimeout(function () {
	                    openScopes.forEach(function () {
	                        console.groupEnd();
	                    });
	                    openScopes.length = 0;
	                    var chain = [];
	                    var cursor = parent;
	                    do {
	                        chain.unshift(cursor);
	                        cursor = cursor.parent;
	                    } while (cursor.label !== '#root');
	                    chain.forEach(function (entry) {
	                        console.group.apply(console, browserFormat(entry));
	                    });
	                    parent.entries.forEach(function (entry) {
	                        print(entry, true);
	                    });
	                    chain.forEach(function () {
	                        console.groupEnd();
	                    });
	                }));
	                return;
	            }
	            entry.printed = true;
	            log.apply(console, browserFormat(entry));
	        }
	    }
	    return print;
	};
	var consoleOutput = typeof window !== 'undefined' ? browserOutput : nodeOutput;

	var R_AT = /at\s+(?:([^\s]+)(?:.*?)\()?((?:http|file|\/)[^)]+:\d+)\)?/;
	var R_EXTRACT_FILE1 = /^(.*?)(?:\/<)*@(.*?)$/;
	var R_EXTRACT_FILE2 = /^()(https?:\/\/.+)/;
	var R_FILE = /^(.*?):(\d+)(?::(\d+))?$/;
	var ANONYMOUS = '<anonymous>';
	function parseStackRow(value) {
	    if (value == null) {
	        return null;
	    }
	    var line = value.match(R_AT);
	    if (line === null) {
	        line = value.match(R_EXTRACT_FILE1) || value.match(R_EXTRACT_FILE2);
	    }
	    if (line) {
	        var file = line[2].match(R_FILE);
	        var row = {
	            fn: line[1] === undefined ? ANONYMOUS : (line[1].trim() || ANONYMOUS),
	            file: '',
	            line: 0,
	            column: 0,
	        };
	        if (file) {
	            row.file = file[1];
	            row.line = parseInt(file[2], 10) || 0;
	            row.column = parseInt(file[3], 10) || 0;
	        }
	        return row;
	    }
	    return null;
	}
	function parseStack(stack) {
	    if (stack == null) {
	        return null;
	    }
	    var rows = stack.trim().split('\n');
	    var list = [];
	    for (var i = 0; i < rows.length; i++) {
	        var row = parseStackRow(rows[i]);
	        if (row !== null) {
	            list.push(row);
	        }
	    }
	    return list;
	}

	var cid = 0;
	function isLogEntry(x) {
	    return x && x.hasOwnProperty('type') && x.hasOwnProperty('level');
	}
	function createLogEntry(level, badge, label, message, detail, meta) {
	    if (meta === void 0) { meta = null; }
	    return {
	        cid: ++cid,
	        type: EntryTypes.entry,
	        level: level,
	        badge: badge,
	        label: label,
	        message: message,
	        detail: detail,
	        meta: meta,
	        parent: null,
	        entries: [],
	    };
	}
	function getMeta(offset) {
	    if (offset === void 0) { offset = 0; }
	    var stackTraceLimit = Error.stackTraceLimit;
	    Error.stackTraceLimit = offset + 1;
	    var error = new Error();
	    var stack = error.stack.split('\n');
	    Error.stackTraceLimit = stackTraceLimit;
	    if (stack.length <= offset + 1) {
	        return null;
	    }
	    return parseStackRow(stack[offset + 1]);
	}
	function createCoreLogger(options, ctx) {
	    return {
	        add: function (message, detail) {
	            var parent = ctx.parent;
	            var entry;
	            // console.log(ctx.parent.message);
	            if (isLogEntry(message)) {
	                entry = message;
	            }
	            else {
	                entry = createLogEntry(LogLevels.log, null, null, message, detail);
	            }
	            if (options.meta && entry.meta === null) {
	                entry.meta = getMeta(3);
	            }
	            var length = (entry.parent = parent).entries.push(entry);
	            if (length > options.storeLast) {
	                parent.entries.splice(0, 1);
	            }
	            if (options.silent !== true) {
	                var idx = options.output.length;
	                while (idx--) {
	                    options.output[idx](entry);
	                }
	            }
	            return entry;
	        },
	    };
	}
	function createScopeEntry(level, badge, label, message, detail, meta, state) {
	    if (meta === void 0) { meta = null; }
	    if (state === void 0) { state = null; }
	    return {
	        cid: ++cid,
	        level: level,
	        type: EntryTypes.scope,
	        badge: badge,
	        label: label,
	        parent: null,
	        message: message,
	        detail: {
	            info: detail,
	            state: state,
	        },
	        meta: meta,
	        entries: [],
	    };
	}
	var _activeContext = null;
	function getLoggerContext() {
	    return _activeContext;
	}
	function switchLoggerContext(ctx, scope) {
	    if (ctx === null) {
	        _activeContext = null;
	        return;
	    }
	    var prev_context = _activeContext;
	    var prev_scope = ctx.scope;
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
	function revertLoggerContext(snapshot) {
	    switchLoggerContext(snapshot.context, snapshot.scope);
	}
	function createLogger(options, factory) {
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
	    var root = createScopeEntry(LogLevels.info, '🚧', '#root', null, null);
	    var _activeScopeContext = {
	        logger: null,
	        parent: root,
	    };
	    var logger = createCoreLogger(options, _activeScopeContext);
	    _activeScopeContext.logger = logger;
	    var setup = function (optionsPatch) {
	        for (var key in optionsPatch) {
	            if (optionsPatch.hasOwnProperty(key)) {
	                options[key] = optionsPatch[key];
	            }
	        }
	    };
	    var api = factory({
	        setup: setup,
	        levels: LogLevels,
	        logger: logger,
	    });
	    // Reserved methods
	    ['add', 'clear', 'scope', 'setup', 'getEntries', 'getLastEntry'].forEach(function (name) {
	        if (api.hasOwnProperty(name)) {
	            throw new SyntaxError("[octologger] \"" + name + "\" is a reserved identifier");
	        }
	    });
	    api.print = function () {
	        function next(root) {
	            root.printed = false;
	            root.entries.forEach(function (entry) {
	                var idx = options.output.length;
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
	        var idx = options.output.length;
	        while (idx--) {
	            options.output[idx](null);
	        }
	    };
	    api.add = function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i] = arguments[_i];
	        }
	        return logger.add(createLogEntry(LogLevels.log, null, null, null, args));
	    };
	    api.clear = function () { return root.entries.splice(0, root.entries.length); };
	    api.setup = setup;
	    api.getEntries = function () { return root.entries; };
	    api.getLastEntry = function () { return root.entries[root.entries.length - 1] || null; };
	    api.scope = function scopeCreator(message, detail, executor) {
	        if (arguments.length === 0) {
	            return this._scopeEntry;
	        }
	        if (executor == null && typeof detail === 'function') {
	            executor = detail;
	            detail = null;
	        }
	        var scopeEntry = isLogEntry(message) ? message : createScopeEntry(LogLevels.info, null, null, message, detail, options.meta ? getMeta(2) : null);
	        _activeScopeContext.logger.add(scopeEntry);
	        var logger = createCoreLogger(options, { parent: scopeEntry });
	        var scopeAPI = factory({
	            setup: setup,
	            levels: LogLevels,
	            logger: logger,
	        });
	        scopeAPI.add = function () {
	            var args = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                args[_i] = arguments[_i];
	            }
	            return logger.add(createLogEntry(LogLevels.log, null, null, null, args));
	        };
	        scopeAPI.scope = scopeCreator;
	        scopeAPI._scopeEntry = scopeEntry;
	        // Переключаем scope
	        if (typeof executor === 'function') {
	            var prev_activeContext = _activeContext;
	            var prev_parentEntry = _activeScopeContext.parent;
	            var prev_parentLogger = _activeScopeContext.logger;
	            _activeContext = {
	                entry: scopeEntry,
	                scope: scopeAPI,
	                logger: logger,
	                options: options,
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
	var BADGES = {
	    info: '❕',
	    warn: '⚠️',
	    error: '🛑',
	    verbose: '🔎',
	    debug: '⁉️',
	    success: '✅',
	};
	var octologger = createLogger({
	    meta: true,
	    output: [consoleOutput()],
	}, function (_a) {
	    var levels = _a.levels, logger = _a.logger;
	    return Object.keys(levels).reduce(function (api, level) {
	        api[level] = function () {
	            var args = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                args[_i] = arguments[_i];
	            }
	            logger.add(createLogEntry(levels[level], BADGES[level] || null, null, null, args));
	        };
	        return api;
	    }, {});
	});

	var DUMMY = {
	    fn: '<anonymous>',
	    file: '',
	    line: 0,
	    column: 0,
	};
	function parseError(err) {
	    var stack = parseStack(err.stack);
	    var stackFirstRow = stack[0] || DUMMY;
	    return {
	        name: err.name,
	        message: err.message,
	        fn: stackFirstRow.fn,
	        file: err.fileName || stackFirstRow.file,
	        line: err.lineNumber || stackFirstRow.line,
	        column: err.columnNumber || stackFirstRow.column,
	        stack: stack,
	    };
	}

	var taskLogDetail = {
	    0: {
	        level: LogLevels.info,
	        badge: null,
	        label: 'success',
	    },
	    1: {
	        level: LogLevels.warn,
	        badge: '⚠️',
	        label: 'cancelled',
	    },
	    2: {
	        level: LogLevels.error,
	        badge: '❌',
	        label: 'failed',
	    },
	};
	function getTaskLogLevel(error, cancelled) {
	    return (+cancelled + +(error != null) * 2);
	}
	function getTaskLogDetail(level) {
	    return taskLogDetail[level];
	}

	var timers = {};
	function createTimerTask(ctx, name, delay, callback, nativeCreate, isRAF, params) {
	    var start = now();
	    var detail = {
	        pid: null,
	        start: start,
	        delay: delay,
	    };
	    var meta = ctx.options.meta ? getMeta(3) : null;
	    var timerScope = ctx.scope.scope(createScopeEntry(LogLevels.verbose, '⏲', null, "Timer \"" + name + "\" started", detail, meta, 'idle'));
	    var resolve = function (error, cancelled) {
	        var level = getTaskLogLevel(error, cancelled);
	        var logLevel = getTaskLogDetail(level);
	        timerScope.scope().detail.state = level === 0 ? 'completed' : (level === 1 ? 'cancelled' : 'failed');
	        ctx.scopeContext.logger.add(createLogEntry(logLevel.level, logLevel.badge, logLevel.label, "Timer \"" + name + "\" " + (level === 0 ? 'completed successfully' : (level === 1 ? 'cancelled' : 'failed')), {
	            error: error,
	            cancelled: cancelled,
	            duration: now() - start,
	        }, meta));
	    };
	    var pid = nativeCreate(function (step) {
	        var prevContext = switchLoggerContext(ctx, timerScope);
	        var error;
	        try {
	            if (isRAF) {
	                callback(step);
	            }
	            else if (!callback.length || !params.length) {
	                callback();
	            }
	            else {
	                switch (params.length) {
	                    case 1:
	                        callback(params[0]);
	                        break;
	                    case 2:
	                        callback(params[0], params[1]);
	                        break;
	                    case 3:
	                        callback(params[0], params[1], params[2]);
	                        break;
	                    case 4:
	                        callback(params[0], params[1], params[2], params[3]);
	                        break;
	                    case 5:
	                        callback(params[0], params[1], params[2], params[3], params[4]);
	                        break;
	                    default:
	                        callback.apply(void 0, params);
	                        break;
	                }
	            }
	        }
	        catch (err) {
	            error = err;
	            globalThis.console.error(err);
	        }
	        resolve(error, false);
	        revertLoggerContext(prevContext);
	    }, delay);
	    detail.pid = pid;
	    timers[pid] = {
	        pid: pid,
	        resolve: resolve,
	        ctx: ctx,
	        scope: timerScope,
	    };
	    return pid;
	}
	function cancelTimerTask(pid, nativeCancel) {
	    nativeCancel(pid);
	    if (timers[pid] === void 0) {
	        var timer = timers[pid];
	        var prevContext = switchLoggerContext(timer.ctx, timer.scope);
	        timer.resolve(null, true);
	        revertLoggerContext(prevContext);
	        delete timers[pid];
	    }
	}

	function patchTimer(scope, isRAF, createName, nativeCreate, cancelName, nativeCancel) {
	    scope[createName] = function (callback, delay) {
	        if (delay === void 0) { delay = 0; }
	        var params = [];
	        for (var _i = 2; _i < arguments.length; _i++) {
	            params[_i - 2] = arguments[_i];
	        }
	        var ctx = getLoggerContext();
	        if (ctx === null) {
	            return isRAF
	                ? nativeCreate(callback)
	                : nativeCreate.apply(void 0, [callback, delay].concat(params));
	        }
	        return createTimerTask(ctx, createName, delay, callback, nativeCreate, isRAF, params);
	    };
	    scope[cancelName] = function (pid) {
	        cancelTimerTask(pid, nativeCancel);
	    };
	    markAsNativeCode(scope, createName);
	    markAsNativeCode(scope, cancelName);
	}
	function patchTimers(scope) {
	    eachTimers(nativeAPI, function (isRAF, setName, setFn, cancelName, cancelFn) {
	        if (scope[setName] === setFn) {
	            patchTimer(scope, isRAF, setName, setFn, cancelName, cancelFn);
	        }
	    });
	}
	function revertPatchTimers(scope) {
	    eachTimers(nativeAPI, function (_, setName, setFn, cancelName, cancelFn) {
	        scope[setName] = setFn;
	        scope[cancelName] = cancelFn;
	    });
	}
	function patchNativeAPI(scope) {
	    patchTimers(scope);
	}
	function revertPatchNativeAPI(scope) {
	    revertPatchTimers(scope);
	}
	function markAsNativeCode(scope, method) {
	    scope[method].toString = function () {
	        return "function " + method + "() { [native code] }";
	    };
	    scope[method].native = nativeAPI[method];
	}

	exports.EntryTypes = EntryTypes;
	exports.isLogEntry = isLogEntry;
	exports.createLogEntry = createLogEntry;
	exports.getMeta = getMeta;
	exports.createScopeEntry = createScopeEntry;
	exports.getLoggerContext = getLoggerContext;
	exports.switchLoggerContext = switchLoggerContext;
	exports.revertLoggerContext = revertLoggerContext;
	exports.createLogger = createLogger;
	exports.octologger = octologger;
	exports.logger = octologger;
	exports.parseError = parseError;
	exports.createFormat = createFormat;
	exports.nodeFromat = nodeFromat;
	exports.browserFormat = browserFormat;
	exports.originalConsole = originalConsole;
	exports.nodeOutput = nodeOutput;
	exports.browserOutput = browserOutput;
	exports.consoleOutput = consoleOutput;
	exports.parseStackRow = parseStackRow;
	exports.parseStack = parseStack;
	exports.LogLevels = LogLevels;
	exports.LogLevelsInvert = LogLevelsInvert;
	exports.patchTimers = patchTimers;
	exports.revertPatchTimers = revertPatchTimers;
	exports.patchNativeAPI = patchNativeAPI;
	exports.revertPatchNativeAPI = revertPatchNativeAPI;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
