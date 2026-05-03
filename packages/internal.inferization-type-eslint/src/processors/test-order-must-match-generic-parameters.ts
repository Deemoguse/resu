import { Result } from '../utils/result'
import { extractIdentifierNode } from './extract-identifier-node'
import { extractParameterNodeByIdentifierNode } from './extract-parameter-node-by-identifier-node'
import type { TSESTree } from '@typescript-eslint/utils'

export function testOrderMustMatchGenericParameters(
	parametersNode: TSESTree.TSTypeParameterDeclaration,
	tupleNode: TSESTree.TSTupleType,
): (
	Result<'error', 'SafeError', TSESTree.TypeNode[]> |
	Result<'ok', null, null>
) {
	const checkedNames = new Set<string>()
	const outPositionTupleElementNodes: TSESTree.TypeNode[] = tupleNode.elementTypes.flatMap((tupleElementNode, tupleElementIndex) => {
		const identifierNode = extractIdentifierNode(tupleElementNode)
		if (identifierNode.status === 'error') return []

		const alredyChecked = checkedNames.has(identifierNode.data.name)
		if (alredyChecked) return []

		checkedNames.add(identifierNode.data.name)

		const parameterNode = extractParameterNodeByIdentifierNode(parametersNode, identifierNode.data)
		if (parameterNode.status === 'error') return []

		const matchIndexes = parameterNode.data.index === tupleElementIndex
		return matchIndexes ? [] : [tupleElementNode]
	})

	return outPositionTupleElementNodes.length
		? Result('error', 'SafeError', outPositionTupleElementNodes)
		: Result('ok')
}
