import { Result } from '../utils/result'
import { extractId } from './extract-id'
import { extractParam } from './extract-param'
import type { TSESTree } from '@typescript-eslint/utils'

export function testOnlyParams(
	paramsNode: TSESTree.TSTypeParameterDeclaration,
	tupleNode: TSESTree.TSTupleType,
): (
	Result<'error', 'SafeError', TSESTree.TypeNode[]> |
	Result<'ok', null, null>
) {
	const invalidNodes: TSESTree.TypeNode[] = tupleNode.elementTypes.flatMap((tupleElementNode) => {
		const tupleElementId = extractId(tupleElementNode)
		if (tupleElementId.status === 'error') return [tupleElementNode]

		const matchedParam = extractParam(paramsNode, tupleElementId.data)
		return matchedParam.status === 'ok' ? [] : [tupleElementNode]
	})

	return invalidNodes.length
		? Result('error', 'SafeError', invalidNodes)
		: Result('ok')
}
