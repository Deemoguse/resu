import { extractIdentifierNode } from './extract-identifier-node'
import { extractParameterNodeByIdentifierNode } from './extract-parameter-node-by-identifier-node'
import type { TSESTree } from '@typescript-eslint/utils'
import { Result } from '../utils/result'

export function testTupleMustNotContainDuplicateGenericTypes(
	parametersNode: TSESTree.TSTypeParameterDeclaration,
	tupleNode: TSESTree.TSTupleType,
): (
	Result<'error', 'SafeError', TSESTree.TypeNode[]> |
	Result<'ok', null, null>
) {
	const checkedNames = new Set<string>()
	const dublicateGenericNodes = tupleNode.elementTypes.flatMap((tupleElementNode) => {
		const identifierNode = extractIdentifierNode(tupleElementNode)
		if (identifierNode.status === 'error') return []

		const parametersNodeWithMatchedNameExist = extractParameterNodeByIdentifierNode(parametersNode, identifierNode.data)
		if (parametersNodeWithMatchedNameExist.status === 'error') return []

		const isDublicate = checkedNames.has(identifierNode.data.name)
		if (isDublicate) return [tupleElementNode]

		checkedNames.add(identifierNode.data.name)
		return []
	})

	return dublicateGenericNodes.length
		? Result('error', 'SafeError', dublicateGenericNodes)
		: Result('ok')
}
