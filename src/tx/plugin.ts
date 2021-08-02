import ts from 'typescript';
import { transformer } from './transformer';

export function txPlugin(checker: ts.TypeChecker) {
	return transformer(checker);
}
