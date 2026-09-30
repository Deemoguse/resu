import { Result } from '../utils/result'
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils'

export function extractTuples(
	node: TSESTree.TSConditionalType,
): (
	Result<'error', null, null> |
	Result<'ok', null, {
		checkTuple: TSESTree.TSTupleType
		extendsTuple: TSESTree.TSTupleType
	}>
) {
	const checkNode = node.checkType
	const checkNodeIsTuple = checkNode.type === AST_NODE_TYPES.TSTupleType
	if (!checkNodeIsTuple) return Result('error')

	const extendsNode = node.extendsType
	const extendsNodeIsTuple = extendsNode.type === AST_NODE_TYPES.TSTupleType
	if (!extendsNodeIsTuple) return Result('error')

	return Result('ok', null, {
		checkTuple: checkNode,
		extendsTuple: extendsNode,
	})
}
