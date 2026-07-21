import { Result } from '../utils/result'
import { extractId } from './extract-id'
import { extractParam } from './extract-param'
import type { TSESTree } from '@typescript-eslint/utils'

export function testTupleOrder(
	paramsNode: TSESTree.TSTypeParameterDeclaration,
	tupleNode: TSESTree.TSTupleType,
): (
	Result<'error', 'SafeError', TSESTree.TypeNode[]> |
	Result<'ok', null, null>
) {
	const checkedNames = new Set<string>()
	const outOfOrderNodes: TSESTree.TypeNode[] = tupleNode.elementTypes.flatMap((tupleElementNode, tupleElementIndex) => {
		const id = extractId(tupleElementNode)
		if (id.status === 'error') return []

		const isChecked = checkedNames.has(id.data.name)
		if (isChecked) return []

		checkedNames.add(id.data.name)

		const param = extractParam(paramsNode, id.data)
		if (param.status === 'error') return []

		const matchIndexes = param.data.index === tupleElementIndex
		return matchIndexes ? [] : [tupleElementNode]
	})

	return outOfOrderNodes.length
		? Result('error', 'SafeError', outOfOrderNodes)
		: Result('ok')
}
