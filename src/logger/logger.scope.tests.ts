import logger, { createScopeEntry } from '../logger/logger';
import { parseError, XError } from '../error/error';
import { LogLevels } from './levels';


beforeEach(() => {
	logger.setup({output: [], meta: true});
	logger.clear();
});

it('scope: base', () => {
	const scope = logger.scope('foo');
	expect(scope.scope().message).toBe('foo');
});

it('scope: createScopeEntry', () => {
	const scope = logger.scope(createScopeEntry(
		LogLevels.info,
		'X',
		'label',
		'msg',
		{foo: 'bar'},
	));

	expect(scope.scope().level).toBe(LogLevels.info);
	expect(scope.scope().badge).toBe('X');
	expect(scope.scope().label).toBe('label');
	expect(scope.scope().message).toBe('msg');
	expect(scope.scope().detail.info).toEqual({foo: 'bar'});
});

it('scope', function scopeTest() {
	let scopeMeta: XError;
	let startMeta = parseError(new Error);
	const scope = logger.scope('delay', {timeout: 123}, function inScope(scope) {
		scopeMeta = parseError(new Error);
		scope.log('wow');
		logger.log('Yep!');
	});
	logger.log('out of scope');

	// Root Entries
	expect(logger.getEntries().length).toEqual(2);
	expect(logger.getLastEntry().detail).toEqual(['out of scope']);

	// Scope API
	expect(typeof scope.log).toEqual('function');

	// Meta
	expect(scope.scope().meta.file).toEqual(startMeta.file);
	expect(scope.scope().meta.line).toEqual(startMeta.line + 1);

	// Info
	expect(scope.scope().detail.info).toEqual({timeout: 123});

	// Entries
	expect(scope.scope().entries.length).toEqual(2);
	expect(scope.scope().entries[0].detail).toEqual(['wow']);
	expect(scope.scope().entries[1].detail).toEqual(['Yep!']);

	// [0] In Scope Meta
	expect(scope.scope().entries[0].meta.file).toEqual(scopeMeta.file);
	expect(scope.scope().entries[0].meta.line).toEqual(scopeMeta.line + 1);
	expect(scope.scope().entries[0].meta.fn).toEqual('inScope');

	// [1] In Scope Meta
	expect(scope.scope().entries[1].meta.file).toEqual(scopeMeta.file);
	expect(scope.scope().entries[1].meta.line).toEqual(scopeMeta.line + 2);
	expect(scope.scope().entries[1].meta.fn).toEqual('inScope');
});

it('nested scopes', function inScope0() {
	const d1 = logger.scope('first', function inScope1(d1) {
		d1.log('depth-1');

		logger.scope('second', function inScope2(d2) {
			d1.log('depth-1-1');
			logger.log('depth-2');

			d2.scope('third', function inScope3(d3) {
				d3.log('depth-3');
			});
		});
	});

	expect(logger.getEntries().length).toEqual(1);

	// D1
	const s1 = d1.scope();
	expect(s1.meta.fn.split('.').pop()).toEqual('inScope0');
	expect(`s1.length:${s1.entries.length}`).toEqual('s1.length:3');

	expect(s1.entries[0].detail).toEqual(['depth-1']);
	expect(s1.entries[0].meta.fn).toEqual('inScope1');

	expect(s1.entries[1].message).toEqual('second');
	expect(s1.entries[1].meta.fn).toEqual('inScope1');

	expect(s1.entries[2].detail).toEqual(['depth-1-1']);
	expect(s1.entries[2].meta.fn).toEqual('inScope2');

	// D2
	const s2 = s1.entries[1];
	expect(s2.meta.fn).toEqual('inScope1');
	expect(`s2.length:${s2.entries.length}`).toEqual('s2.length:2');

	expect(s2.entries[0].detail).toEqual(['depth-2']);
	expect(s2.entries[0].meta.fn).toEqual('inScope2');

	expect(s2.entries[1].message).toEqual('third');
	expect(s2.entries[1].meta.fn).toEqual('inScope2');

	// D3
	const s3 = s2.entries[1];
	expect(s3.meta.fn).toEqual('inScope2');
	expect(`s3.length:${s3.entries.length}`).toEqual('s3.length:1');
	expect(s3.entries[0].detail).toEqual(['depth-3']);
	expect(s3.entries[0].meta.fn).toEqual('inScope3');
});