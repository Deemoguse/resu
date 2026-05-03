import { Result } from '../utils/result'
import { extractIdentifierNode } from './extract-identifier-node'
import { extractParameterNodeByIdentifierNode } from './extract-parameter-node-by-identifier-node'
import type { TSESTree } from '@typescript-eslint/utils'

export function testNotContainNonGenericTypes(
	parametersNode: TSESTree.TSTypeParameterDeclaration,
	tupleNode: TSESTree.TSTupleType,
): (
	Result<'error', 'SafeError', TSESTree.TypeNode[]> |
	Result<'ok', null, null>
) {
	const nonGenericNodes: TSESTree.TypeNode[] = tupleNode.elementTypes.flatMap((tupleElementNode) => {
		const tupleElementNodeIdentifierNode = extractIdentifierNode(tupleElementNode)
		if (tupleElementNodeIdentifierNode.status === 'error') return [tupleElementNode]

		const parameterNodeWithMatchedName = extractParameterNodeByIdentifierNode(parametersNode, tupleElementNodeIdentifierNode.data)
		return parameterNodeWithMatchedName.status === 'ok' ? [] : [tupleElementNode]
	})

	return nonGenericNodes.length
		? Result('error', 'SafeError', nonGenericNodes)
		: Result('ok')
}
