import typescript from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-replace';
import { uglify } from 'rollup-plugin-uglify';
import ts from 'typescript';

export default [true, false].map(dev => ({
	input: './index.ts',

	output: {
		file: `octologger${dev ? '.dev' : ''}.js`,
		format: 'umd',
		name: 'octologger',
	},

	plugins: [].concat(
		typescript({
			declaration: true,
			typescript: ts,
		}),

		replace({
			'process.env.NODE_ENV': JSON.stringify(dev ? 'dev' : 'production'),
		}),

		dev ? [] : uglify(),
	),
}));