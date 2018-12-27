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

	var R_AT_WITH_PROTOCOL = /at\s+([^\s]+)(?:.*?)\(((?:http|file|\/)[^)]+:\d+)\)/;
	var R_AT = /at\s+([^\s]+)(?:.*?)\(((?:http|file|\/)[^)]+:\d+)\)/;
	var R_EXTRACT_FILE1 = /^(.*?)(?:\/<)*@(.*?)$/;
	var R_EXTRACT_FILE2 = /^()(https?:\/\/.+)/;
	var R_FILE = /^(.*?):(\d+)(?::(\d+))?$/;
	function parseStackRow(value) {
	    if (value == null) {
	        return null;
	    }
	    var line = value.match(R_AT_WITH_PROTOCOL);
	    if (!line) {
	        line = value.match(R_AT);
	        if (line) {
	            line[0] = '';
	            line.unshift('');
	        }
	        else {
	            line = value.match(R_EXTRACT_FILE1) || value.match(R_EXTRACT_FILE2);
	        }
	    }
	    if (line) {
	        var file = line[2].match(R_FILE);
	        var row = {
	            fn: (line[1].trim() || '<anonymous>'),
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

	var LogLevels = {
	    error: 0,
	    warn: 1,
	    info: 2,
	    verbose: 3,
	    debug: 4,
	    log: 5
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
	        verbose: '\x1b[35m',
	        debug: '\x1b[35m',
	    },
	    label: {
	        error: '\x1b[4m',
	        warn: '\x1b[4m',
	        log: '\x1b[4m',
	        info: '\x1b[4m',
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
	var browserFormat = createFormat({
	    level: {
	        error: 'color: red;',
	        warn: 'color: orange;',
	        log: 'color: #333;',
	        info: 'color: dodgerblue;',
	        verbose: 'color: magenta;',
	        debug: 'color: #8b1fdd;',
	    },
	    label: {
	        error: 'text-decoration: underline;',
	        warn: 'text-decoration: underline;',
	        log: 'text-decoration: underline;',
	        info: 'text-decoration: underline;',
	        verbose: 'text-decoration: underline;',
	        debug: 'text-decoration: underline;',
	        silly: 'text-decoration: underline;',
	    },
	}, function (_, entry, style) {
	    var fmt = [];
	    var args = [];
	    if (entry.badge !== null) {
	        fmt.push('%s');
	        args.push(entry.badge);
	    }
	    if (entry.label !== null) {
	        fmt.push('%c%s%c');
	        args.push(style.label, entry.label, style.label.replace(R_VALUE, ': inherit'));
	    }
	    if (entry.message !== null) {
	        fmt.push('%c%s');
	        args.push(style.base, entry.message);
	    }
	    if (entry.detail !== null) {
	        var detail = entry.detail;
	        var n = detail.length;
	        if (entry.message === null && n >= 0 && (0 in detail)) {
	            fmt.push('%c');
	            args.push(style.base);
	            for (var i = 0; i < n; i++) {
	                var val = detail[i];
	                fmt.push(typeof val === 'string' ? '%s' : '%o');
	                args.push(val);
	            }
	        }
	        else {
	            fmt.push('%o');
	            args.push(detail);
	        }
	    }
	    if (entry.meta !== null) {
	        fmt.push('%s');
	        args.push(entry.meta.file + ":" + entry.meta.line + ":" + entry.meta.column + " (" + entry.meta.fn + ")");
	    }
	    args.unshift(fmt.join(' '));
	    return args;
	});

	var originalConsole = typeof console !== 'undefined' && console.log ? console : null;
	var nodeOutput = function (console) {
	    if (console === void 0) { console = originalConsole; }
	    return function (entry) {
	        var level = LogLevelsInvert[entry.level];
	        console[level].apply(console, nodeFromat(entry));
	    };
	};
	var browserOutput = function (console) {
	    if (console === void 0) { console = originalConsole; }
	    var log = console.log.apply
	        ? console.log
	        : Function.prototype.bind.call(console.log, console);
	    return function (entry) {
	        log.apply(console, browserFormat(entry));
	    };
	};
	var consoleOutput = typeof window !== 'undefined' ? browserOutput : nodeOutput;

	function isLogEntry(x) {
	    return x && x.hasOwnProperty('type') && x.hasOwnProperty('level');
	}
	function createLogEntry(level, badge, label, message, detail, meta) {
	    if (meta === void 0) { meta = null; }
	    return {
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
	    var stack = parseError(new Error).stack;
	    if (stack.length <= offset) {
	        return null;
	    }
	    return {
	        fn: stack[offset].fn,
	        file: stack[offset].file,
	        line: stack[offset].line,
	        column: stack[offset].column,
	    };
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
	            var idx = options.output.length;
	            while (idx--) {
	                options.output[idx](entry);
	            }
	            return entry;
	        },
	    };
	}
	function createScopeEntry(level, badge, label, message, detail, meta) {
	    if (meta === void 0) { meta = null; }
	    return {
	        level: level,
	        type: EntryTypes.scope,
	        badge: badge,
	        label: label,
	        parent: null,
	        message: message,
	        detail: {
	            info: detail,
	            state: null,
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
	    ['clear', 'scope', 'setup', 'getEntries', 'getLastEntry'].forEach(function (name) {
	        if (api.hasOwnProperty(name)) {
	            throw new SyntaxError("[octologger] \"" + name + "\" is a reserved identifier");
	        }
	    });
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
	        var scopeEntry = isLogEntry(message) ? message : createScopeEntry(LogLevels.info, '↘️', null, message, detail, options.meta ? getMeta(2) : null);
	        _activeScopeContext.logger.add(scopeEntry);
	        var logger = createCoreLogger(options, { parent: scopeEntry });
	        var scopeAPI = factory({
	            setup: setup,
	            levels: LogLevels,
	            logger: logger,
	        });
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
	var octlogger = createLogger({
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
	            logger.add(createLogEntry(levels[level], null, null, null, args));
	        };
	        return api;
	    }, {});
	});

	exports.EntryTypes = EntryTypes;
	exports.isLogEntry = isLogEntry;
	exports.createLogEntry = createLogEntry;
	exports.getMeta = getMeta;
	exports.createScopeEntry = createScopeEntry;
	exports.getLoggerContext = getLoggerContext;
	exports.switchLoggerContext = switchLoggerContext;
	exports.revertLoggerContext = revertLoggerContext;
	exports.createLogger = createLogger;
	exports.octlogger = octlogger;
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

	Object.defineProperty(exports, '__esModule', { value: true });

})));
