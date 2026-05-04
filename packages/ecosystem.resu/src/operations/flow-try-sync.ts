import { FlowTryCreateWith } from '../factories/flow-try-create-with'

export type FlowTrySync<
	T,
	C = never,
> =
	[T, C] extends [unknown, unknown]
		? FlowTryCreateWith.Return<T, C>
		: never

export const FlowTrySync: FlowTryCreateWith<'sync'> = FlowTryCreateWith('sync')
