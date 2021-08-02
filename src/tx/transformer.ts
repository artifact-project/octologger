import ts from 'typescript';
import * as path from 'path';

const CWD = process.cwd();

type TxAPI = {
	checker: ts.TypeChecker;
	context: ts.TransformationContext
	sourceFile: ts.SourceFile;
}

function visitNode(node: ts.Node, {checker, sourceFile}: TxAPI) {
	if (ts.isCallExpression(node)) {
		const {
			arguments:args,
			typeArguments,
			expression,
		} = node;
		const signature = checker.getResolvedSignature(node);
		const returnType = signature && checker.typeToString(signature?.getReturnType())

		// console.log(node.getText(), returnType);

		if (!returnType || !returnType.startsWith('OctoShell<') || !args.length) {
			return node;
		}
		
		const {line, character} = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
		const metaArg: any = ts.factory.createIdentifier(JSON.stringify([
			path.relative(CWD, sourceFile.fileName),
			line + 1,
			character + 1,
		]));
		
		try {
			metaArg.parent = (args[0] as any).parent;
			(args as any).unshift(metaArg);

			return ts.factory.updateCallExpression(
				node,
				expression,
				typeArguments,
				args,
			);
		} catch (err) {
			console.log('[octologger.tx] Update Call Expression failed:', err);
		}
	}

	return node;
}

function visitNodeAndChildren(
	node: ts.Node,
	api: TxAPI
) {
	return ts.visitEachChild(
		visitNode(node, api),
		(childNode) => visitNodeAndChildren(childNode, api),
		api.context,
	);
}

export function transformer(checkerOrProgram?: ts.TypeChecker | ts.Program) {
	let checker = checkerOrProgram && 'getTypeChecker' in checkerOrProgram
		? checkerOrProgram.getTypeChecker()
		: checkerOrProgram
	;

	return (context: ts.TransformationContext) => {
		return (sourceFile: ts.SourceFile, skip?: boolean) => {
			if (sourceFile.isDeclarationFile || skip === true) {
				return sourceFile;
			}

			if (!checker) {
				const program = ts.createProgram({
					rootNames: ['./index.ts'], 
					options: context.getCompilerOptions(),
				});

				checker = program.getTypeChecker();
				// sourceFile = program.getSourceFiles().find(({fileName}) => {
				// 	return fileName === sourceFile.fileName
				// })!;
			}

			sourceFile.forEachChild((node) => {
				visitNodeAndChildren(node, {
					checker: checker!,
					context,
					sourceFile,
				});
			});

			return sourceFile;
		}
	}
}
