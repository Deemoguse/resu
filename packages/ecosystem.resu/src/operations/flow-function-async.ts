import { FlowFunctionWith } from '../factories/flow-function-create-with'

export type FlowFunctionAsync<
	A extends unknown[],
	R,
> =
	[A, R] extends [unknown, unknown]
		? FlowFunctionWith.Return<'async', A, R>
		: never

export const FlowFunctionAsync: FlowFunctionWith<'async'> = FlowFunctionWith('async')
