import { ResultIs } from '../operations/result-is'
import { ResultIsOk } from '../operations/result-is-ok'
import { ResultIsError } from '../operations/result-is-error'
import { ResultOkFrom } from '../operations/result-ok-from'
import { ResultErrorFrom } from '../operations/result-error-from'
import type { Result } from '../classes/result'
import type { ResultAnyOk } from '../operations/result-any-ok'
import type { ResultAnyError } from '../operations/result-any-error'
import type { NonUndefinedSync } from '../types/non-undefined-sync'

export namespace ResultFromUnlessWith {
	export type Return<
		S extends Result.Status,
		V,
		T extends Result.Tag = never,
	> =
		[S, V, T] extends [unknown, unknown, unknown]
			? S extends 'ok'
				? V extends ResultAnyError ? V : ResultOkFrom<V, T>
				: V extends ResultAnyOk ? V : ResultErrorFrom<V, T>
			: never
}

export type ResultFromUnlessWith<
	S extends Result.Status,
> =
	[S] extends [unknown]
		? <
			V,
			T extends Result.Tag,
		> (
			value: NonUndefinedSync<V>,
			tag?: T,
		) => (
			ResultFromUnlessWith.Return<S, V, T>
		)
		: never

export function ResultFromUnlessWith<
	S extends Result.Status,
>(
	status: S,
): (
	ResultFromUnlessWith<S>
) {
	const isResultWithStatus = status === 'ok' ? ResultIsOk : ResultIsError
	const resultResolve = status === 'ok' ? ResultOkFrom : ResultErrorFrom
	const resultResolveOpposite = status === 'ok' ? ResultErrorFrom : ResultOkFrom
	return ((value: unknown, tag) => {
		return !ResultIs(value) || isResultWithStatus(value)
			? resultResolve(value, tag)
			: resultResolveOpposite(value)
	}) as ResultFromUnlessWith<S>
}
