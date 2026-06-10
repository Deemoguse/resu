import { ResultIs } from '../operations/result-is'
import { FlowTryAsync } from '../operations/flow-try-async'
import { FlowTrySync } from '../operations/flow-try-sync'
import type { ResultAny } from '../operations/result-any'
import type { NonUndefinedSync } from '../types/non-undefined-sync'
import type { NonUndefinedAsync } from '../types/non-undefined-async'
import type { ResultExtractOk } from '../operations/result-extract-ok'
import type { ResultAnyOk } from '../operations/result-any-ok'

export namespace RuntimeUnwrapCreateWith {
	export type Return<
		T1 extends 'sync' | 'async',
		T2 extends 'untagged' | 'tagged',
		R extends ResultAny,
	> =
		[T1, T2, R] extends [unknown, unknown, unknown]
			? T1 extends 'async'
				? AsyncGenerator<
					FlowTryAsync<R>,
					ResultExtractOk<R> extends infer U extends ResultAnyOk
						? T2 extends 'tagged' ? { tag: U['tag'], data: U['data'] } : U['data']
						: never
				>
				: Generator<
					FlowTrySync<R>,
					ResultExtractOk<R> extends infer U extends ResultAnyOk
						? T2 extends 'tagged' ? { tag: U['tag'], data: U['data'] } : U['data']
						: never
				>
			: never

}

export type RuntimeUnwrapCreateWith<
	T1 extends 'sync' | 'async',
	T2 extends 'untagged' | 'tagged',
> =
	[T1, T2] extends [unknown, unknown]
		? {
			<V, R extends ResultAny>(
				value: T1 extends 'async'
					? NonUndefinedAsync<V>
					: NonUndefinedSync<V>,
				map: (value: V) => T1 extends 'async'
					? NonUndefinedAsync<R>
					: NonUndefinedSync<R>
			): (
				RuntimeUnwrapCreateWith.Return<T1, T2, R>
			)

			<R extends ResultAny>(
				result: T1 extends 'async'
					? NonUndefinedAsync<R>
					: NonUndefinedSync<R>
			): (
				RuntimeUnwrapCreateWith.Return<T1, T2, R>
			)
		}
		: never

export function RuntimeUnwrapCreateWith<
	T1 extends 'sync' | 'async',
	T2 extends 'untagged' | 'tagged',
>(
	type: T1,
	subtype: T2,
): (
	RuntimeUnwrapCreateWith<T1, T2>
) {
	if (type === 'async') return async function* (value, map) {
		const resolvedValue = await value
		const result = !ResultIs(resolvedValue)
			? await FlowTryAsync<ResultAny>(() => map(resolvedValue))
			: resolvedValue

		yield result

		return subtype === 'tagged'
			? { data: result.data, tag: result.tag }
			: result.data
	} as RuntimeUnwrapCreateWith<'async', T2> as RuntimeUnwrapCreateWith<T1, T2>

	else return function* (value, map) {
		const result = !ResultIs(value)
			? FlowTrySync<ResultAny>(() => map(value))
			: value

		yield result

		return subtype === 'tagged'
			? { data: result.data, tag: result.tag }
			: result.data
	} as RuntimeUnwrapCreateWith<'sync', T2> as RuntimeUnwrapCreateWith<T1, T2>
}
