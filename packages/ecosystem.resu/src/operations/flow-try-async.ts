import { FlowTryWith } from '../factories/flow-try-create-with'

export type FlowTryAsync<
	T,
	C = never,
	S extends boolean = false,
> =
	[T, C, S] extends [unknown, unknown, unknown]
		? Promise<FlowTryWith.Return<T, C, S>>
		: never

export const FlowTryAsync: FlowTryWith<'async'> = FlowTryWith('async')
