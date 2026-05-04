import { FlowFunctionCreateWith } from '../factories/flow-function-create-with'

export type FlowFunctionAsync<
	A extends unknown[],
	R,
> =
	[A, R] extends [unknown, unknown]
		? FlowFunctionCreateWith.Return<'async', A, R>
		: never

export const FlowFunctionAsync: FlowFunctionCreateWith<'async'> = FlowFunctionCreateWith('async')
