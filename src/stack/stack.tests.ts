import { parseStackRow } from './stack';

it('null', () => {
	expect(parseStackRow(null)).toEqual(null);
	expect(parseStackRow('')).toEqual(null);
	expect(parseStackRow('dsgdsgsdg')).toEqual(null);
});

it('at Object.logger.meta (file)', () => {
	expect(parseStackRow('    at Object.logger.meta (file:////logger/logger.js:544:10)')).toEqual({
		file: 'file:////logger/logger.js',
		fn: 'Object.logger.meta',
		line: 544,
		column: 10,
	});
});

it('at Object.logger.meta (ip)', () => {
	expect(parseStackRow('    at Object.logger.meta (http://127.0.0.1:1625/logger/logger.js:544:10))')).toEqual({
		file: 'http://127.0.0.1:1625/logger/logger.js',
		fn: 'Object.logger.meta',
		line: 544,
		column: 10,
	});
});

it('at Object.logger.meta (domain)', () => {
	expect(parseStackRow('   at Object.logger.meta (http://domain.com/logger/logger.js:593:5)')).toEqual({
		file: 'http://domain.com/logger/logger.js',
		fn: 'Object.logger.meta',
		line: 593,
		column: 5,
	});
});

it('logger.meta@http', () => {
	expect(parseStackRow('logger.meta@http://domain.com/logger/logger.js:593:5')).toEqual({
		file: 'http://domain.com/logger/logger.js',
		fn: 'logger.meta',
		line: 593,
		column: 5,
	});
});

it('at request', () => {
	expect(parseStackRow('   at request (//temp/@1_request@1_request.js:9),')).toEqual({
		file: '//temp/@1_request@1_request.js',
		fn: 'request',
		line: 9,
		column: 0,
	});
});

it('anonymous', () => {
	expect(parseStackRow('http://domain.com/logger/logger.test.js:107:18')).toEqual({
		file: 'http://domain.com/logger/logger.test.js',
		fn: '<anonymous>',
		line: 107,
		column: 18,
	});
});

it('eval anonymous', () => {
	expect(parseStackRow('at build_banner12987844 (eval at <anonymous> (http://domain.com/build/lmd.js?1425299727697:1:25417), <anonymous>:39:24)')).toEqual({
		file: 'http://domain.com/build/lmd.js?1425299727697',
		fn: 'build_banner12987844',
		line: 1,
		column: 25417,
	});
});