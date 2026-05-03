import { Result } from '../utils/result'
import { TSESTree } from '@typescript-eslint/utils'

export function extractParameterNodeByIdentifierNode(
	parameterNode: TSESTree.TSTypeParameterDeclaration,
	identifierNode: TSESTree.Identifier,
): (
	Result<'error', null, null> |
	Result<'ok', null, { node: TSESTree.TSTypeParameter, index: number }>
) {
	const parameterNodeIndex = parameterNode.params.findIndex((parameterNode) => parameterNode.name.name === identifierNode.name)
	if (parameterNodeIndex === -1) return Result('error')

	const parameterNodeByIndex = parameterNode.params[parameterNodeIndex]
	if (!parameterNodeByIndex) return Result('error')

	return Result('ok', null, {
		node: parameterNodeByIndex,
		index: parameterNodeIndex,
	})
}
