import { FlowTrySync } from '../operations/flow-try-sync'
import { FlowTryAsync } from '../operations/flow-try-async'
import type { NonUndefinedSync } from '../types/non-undefined-sync'
import type { NonUndefinedAsync } from '../types/non-undefined-async'

export namespace FlowFunctionWith {
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

export type FlowFunctionWith<M extends 'sync' | 'async'> =
	[M] extends [unknown]
		? M extends 'sync'
			? <R, A extends unknown[]>(func: (...args: A) => NonUndefinedSync<R>) => FlowFunctionWith.Return<M, A, R>
			: <R, A extends unknown[]>(func: (...args: A) => NonUndefinedAsync<R>) => FlowFunctionWith.Return<M, A, R>
		: never

export function FlowFunctionWith<M extends 'sync' | 'async'>(mode: M): FlowFunctionWith<M> {
	return function (func: (...args: unknown[]) => unknown) {
		return function (...args: unknown[]) {
			return mode === 'sync'
				? FlowTrySync(() => func(...args))
				: FlowTryAsync(() => func(...args))
		}
	} as FlowFunctionWith<M>
}
