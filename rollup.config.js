import typescript from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-replace';
import { uglify } from 'rollup-plugin-uglify';
import ts from 'typescript';

export default ['production', 'dev'].forEach(NODE_ENV => ({
	input: './index.ts',

	output: {
		file: NODE_ENV === 'dev' ? 'dev.js' : 'index.js',
		format: 'umd',
		name: 'octologger',
	},

	plugins: [].concat(
		typescript({
			declaration: true,
			typescript: ts,
		}),

		replace({
			'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
		}),

		NODE_ENV === 'dev' ? [] : uglify(),
	),
}));