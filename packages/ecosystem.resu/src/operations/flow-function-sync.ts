import { FlowFunctionWith } from '../factories/flow-function-create-with'

export type FlowFunctionSync<
	A extends unknown[],
	R,
> =
	[A, R] extends [unknown, unknown]
		? FlowFunctionWith.Return<'sync', A, R>
		: never

export const FlowFunctionSync: FlowFunctionWith<'sync'> = FlowFunctionWith('sync')
