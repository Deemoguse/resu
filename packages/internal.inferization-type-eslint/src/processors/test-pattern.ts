import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils'
import { Result } from '../utils/result'

export function testPattern(
	checkTuple: TSESTree.TSTupleType,
	extendsTuple: TSESTree.TSTupleType,
	patternType: 'any' | 'unknown',
): (
	Result<'error', 'SafeError', null> |
	Result<'ok', null, null>
) {
	const matchLength = checkTuple.elementTypes.length === extendsTuple.elementTypes.length
	if (!matchLength) return Result('error', 'SafeError')

	const patternMatchesType = extendsTuple.elementTypes.every((tupleElementNode) => {
		return patternType === 'any'
			? tupleElementNode.type === AST_NODE_TYPES.TSAnyKeyword
			: tupleElementNode.type === AST_NODE_TYPES.TSUnknownKeyword
	})

	return patternMatchesType
		? Result('ok')
		: Result('error', 'SafeError')
}
