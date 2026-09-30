import { Result } from '../utils/result'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'

export function testCondition(node: TSESTree.TypeNode): (
	Result<'error', null, null> |
	Result<'ok', null, TSESTree.TSConditionalType>
) {
	return node.type === AST_NODE_TYPES.TSConditionalType
		? Result('ok', null, node)
		: Result('error', null, null)
}
