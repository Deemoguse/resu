import { Result } from '../utils/result'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'

export function testConditionElseBranchReturnNever(
	node: TSESTree.TSConditionalType,
): (
	Result<'error', 'SafeError', null> |
	Result<'ok', null, null>
) {
	const falseNode = node.falseType
	const falseNodeIsNever = falseNode.type === AST_NODE_TYPES.TSNeverKeyword

	return falseNodeIsNever ? Result('ok') : Result('error', 'SafeError')
}
