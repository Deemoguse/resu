import { FlowTryWith } from '../factories/flow-try-create-with'

export type FlowTrySync<
	T,
	C = never,
> =
	[T, C] extends [unknown, unknown]
		? FlowTryWith.Return<T, C>
		: never

export const FlowTrySync: FlowTryWith<'sync'> = FlowTryWith('sync')
