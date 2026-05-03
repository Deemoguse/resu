import { Result } from '../utils/result'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'

export function extractIdentifierNode(
	node: TSESTree.TypeNode,
): (
	Result<'error', null, null> |
	Result<'ok', null, TSESTree.Identifier>
) {
	const isTypeReference = node.type === AST_NODE_TYPES.TSTypeReference
	if (!isTypeReference) return Result('error')

	const containArgumentsNodes = node.typeArguments
	if (containArgumentsNodes) return Result('error')

	const nameNode = node.typeName
	const nameTypeIsIndentifier = nameNode.type === AST_NODE_TYPES.Identifier
	if (!nameTypeIsIndentifier) return Result('error')

	return Result('ok', null, nameNode)
}
