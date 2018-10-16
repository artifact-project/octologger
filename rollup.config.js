import typescript from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-replace';
import { uglify } from 'rollup-plugin-uglify';
import ts from 'typescript';

const IS_DEV = process.env.NODE_ENV !== 'production';

export default {
	input: './index.ts',
	output: {
		file: IS_DEV ? 'dev.js' : 'index.js',
		format: 'umd',
		name: 'MR',
	},
	plugins: [].concat(
		typescript({
			declaration: true,
			typescript: ts,
		}),

		replace({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
		}),

		IS_DEV ? [] : uglify()
	),
};