import { FlowTryCreateWith } from '../factories/flow-try-create-with'

export type FlowTryAsync<
	T,
	C = never,
	S extends boolean = false,
> =
	[T, C, S] extends [unknown, unknown, unknown]
		? Promise<FlowTryCreateWith.Return<T, C, S>>
		: never

export const FlowTryAsync: FlowTryCreateWith<'async'> = FlowTryCreateWith('async')
