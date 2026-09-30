import { Result } from '../utils/result'
import { TSESTree } from '@typescript-eslint/utils'

export function extractParam(
	paramsNode: TSESTree.TSTypeParameterDeclaration,
	idNode: TSESTree.Identifier,
): (
	Result<'error', null, null> |
	Result<'ok', null, { node: TSESTree.TSTypeParameter, index: number }>
) {
	const paramIndex = paramsNode.params.findIndex((paramNode) => paramNode.name.name === idNode.name)
	if (paramIndex === -1) return Result('error')

	const paramNode = paramsNode.params[paramIndex]
	if (!paramNode) return Result('error')

	return Result('ok', null, {
		node: paramNode,
		index: paramIndex,
	})
}
