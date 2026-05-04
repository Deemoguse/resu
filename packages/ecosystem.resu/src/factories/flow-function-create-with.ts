import { FlowTrySync } from '../operations/flow-try-sync'
import { FlowTryAsync } from '../operations/flow-try-async'
import type { NonUndefined } from '../types/non-undefined'

export namespace FlowFunctionCreateWith {
	export type Return<
		M extends 'sync' | 'async',
		A extends unknown[],
		R,
	> =
		[M, A, R] extends [unknown, unknown, unknown]
			? M extends 'sync'
				? (...args: A) => FlowTrySync<R>
				: (...args: A) => FlowTryAsync<R>
			: never
}

export type FlowFunctionCreateWith<M extends 'sync' | 'async'> =
	[M] extends [unknown]
		? M extends 'sync'
			? <R, A extends unknown[]>(func: (...args: A) => NonUndefined<R>) => FlowFunctionCreateWith.Return<M, A, R>
			: <R, A extends unknown[]>(func: (...args: A) => NonUndefined<R> | Promise<NonUndefined<R>>) => FlowFunctionCreateWith.Return<M, A, R>
		: never

export function FlowFunctionCreateWith<M extends 'sync' | 'async'>(mode: M): FlowFunctionCreateWith<M> {
	return function (func: (...args: unknown[]) => unknown) {
		return function (...args: unknown[]) {
			return mode === 'sync'
				? FlowTrySync(() => func(...args))
				: FlowTryAsync(() => func(...args))
		}
	} as FlowFunctionCreateWith<M>
}
