import { Result } from '../utils/result'
import { extractIdentifierNode } from './extract-identifier-node'
import type { TSESTree } from '@typescript-eslint/utils'

export function testTupleIncludeAllParameters(
	parameterNode: TSESTree.TSTypeParameterDeclaration,
	tupleNode: TSESTree.TSTupleType,
): (
	Result<'error', 'SafeError', null> |
	Result<'ok', null, null>
) {
	const tupleIncludeAllParameters = parameterNode.params.every((parameterNode) => {
		return tupleNode.elementTypes.find((tupleElementNode) => {
			const tupleElementIdentifierNode = extractIdentifierNode(tupleElementNode)
			if (tupleElementIdentifierNode.status === 'error') return false

			return tupleElementIdentifierNode.data.name === parameterNode.name.name
		})
	})

	return tupleIncludeAllParameters ? Result('ok') : Result('error', 'SafeError')
}
