import ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { transformer } from './transformer';

const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
    jsx: ts.JsxEmit.Preserve,
    removeComments: false,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
};

function readCompilerOptions(file: string): ts.CompilerOptions {
	const configFile = ts.findConfigFile(file, fs.existsSync);

	if (configFile) {
		const configSourceFile = ts.readJsonConfigFile(configFile, (f) => `${fs.readFileSync(f)}`);
		const config = ts.parseJsonSourceFileConfigFileContent(configSourceFile, ts.sys, path.dirname(configFile));

		return config.options;
	}

	return {};
}

const fixtureName = 'transformer.fixture.ts';
const fixtureFile = path.join(__dirname, fixtureName);
const fixtureContent = fs.readFileSync(fixtureFile) + '';
const tsCompilerOptions = {
	...readCompilerOptions(fixtureFile),
	noEmit: true,
	target: ts.ScriptTarget.ES2020,
	module: ts.ModuleKind.ES2020,
};


describe('transformer', () => {
	it('createProgram', () => {
		const program = ts.createProgram([fixtureFile], tsCompilerOptions);
		const checker = program.getTypeChecker();
		const context: ts.TransformationContext = {
			...(ts as any).nullTransformationContext as ts.TransformationContext,
			getCompilerOptions: () => program.getCompilerOptions(),
		};
		const tx = transformer(checker);
	
		for (const sourceFile of program.getSourceFiles()) {
			const isFixture = sourceFile.fileName.includes(fixtureName);
			const result = tx(context)(sourceFile, !isFixture);
			
			if (isFixture) {
				const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
				const out = printer.printFile(result);
				
				expect(`${sourceFile.fileName}\n\n${out}\n`).toMatchSnapshot();
			}
		}
	});

	xit('transpile', () => {
		const result = ts.transpile(fixtureContent, tsCompilerOptions);
		expect(result).toMatchSnapshot();
	});

	xit('transpileModule', () => {
		const {outputText} = ts.transpileModule(fixtureContent, {
			fileName: fixtureFile,
			compilerOptions: tsCompilerOptions,
			transformers: {
				before: [
					transformer(),
				],
			},
		});

		expect(outputText).toMatchSnapshot();
	});
})
