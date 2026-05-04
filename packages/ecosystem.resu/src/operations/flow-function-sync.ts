import { FlowFunctionCreateWith } from '../factories/flow-function-create-with'

export type FlowFunctionSync<
	A extends unknown[],
	R,
> =
	[A, R] extends [unknown, unknown]
		? FlowFunctionCreateWith.Return<'sync', A, R>
		: never

export const FlowFunctionSync: FlowFunctionCreateWith<'sync'> = FlowFunctionCreateWith('sync')
