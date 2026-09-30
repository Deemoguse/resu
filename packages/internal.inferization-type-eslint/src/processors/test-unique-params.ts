import { extractId } from './extract-id'
import { extractParam } from './extract-param'
import type { TSESTree } from '@typescript-eslint/utils'
import { Result } from '../utils/result'

export function testUniqueParams(
	paramsNode: TSESTree.TSTypeParameterDeclaration,
	tupleNode: TSESTree.TSTupleType,
): (
	Result<'error', 'SafeError', TSESTree.TypeNode[]> |
	Result<'ok', null, null>
) {
	const checkedNames = new Set<string>()
	const duplicateNodes = tupleNode.elementTypes.flatMap((tupleElementNode) => {
		const id = extractId(tupleElementNode)
		if (id.status === 'error') return []

		const matchedParam = extractParam(paramsNode, id.data)
		if (matchedParam.status === 'error') return []

		const isDuplicate = checkedNames.has(id.data.name)
		if (isDuplicate) return [tupleElementNode]

		checkedNames.add(id.data.name)
		return []
	})

	return duplicateNodes.length
		? Result('error', 'SafeError', duplicateNodes)
		: Result('ok')
}
