import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils'
import { Result } from '../utils/result'

export function testPatternMustInferAllGenericTypeParameters(
	checkedTupleNode: TSESTree.TSTupleType,
	extendsTupleNode: TSESTree.TSTupleType,
): (
	Result<'error', 'SafeError', null> |
	Result<'ok', null, null>
) {
	const matchLength = checkedTupleNode.elementTypes.length === extendsTupleNode.elementTypes.length
	if (!matchLength) return Result('error', 'SafeError')

	const extendsTupleElementNodesIsInfer = extendsTupleNode.elementTypes.every((tupleElementNode) => {
		return tupleElementNode.type === AST_NODE_TYPES.TSInferType
	})

	return extendsTupleElementNodesIsInfer
		? Result('ok')
		: Result('error', 'SafeError')
}
