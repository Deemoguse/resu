import { Result } from '../utils/result'
import { extractId } from './extract-id'
import type { TSESTree } from '@typescript-eslint/utils'

export function testAllParams(
	paramsNode: TSESTree.TSTypeParameterDeclaration,
	tupleNode: TSESTree.TSTupleType,
): (
	Result<'error', 'SafeError', null> |
	Result<'ok', null, null>
) {
	const hasAllParams = paramsNode.params.every((paramNode) => {
		return tupleNode.elementTypes.find((tupleElementNode) => {
			const tupleElementId = extractId(tupleElementNode)
			if (tupleElementId.status === 'error') return false

			return tupleElementId.data.name === paramNode.name.name
		})
	})

	return hasAllParams ? Result('ok') : Result('error', 'SafeError')
}
