import { Result } from '../classes/result'
import { ResultOk } from '../operations/result-ok'
import { ResultError } from '../operations/result-error'
import { ResultIs } from '../operations/result-is'
import type { NonUndefined } from '../types/non-undefined'

export namespace ResultFromWith {
	export type Return<
		S extends Result.Status,
		V,
		T extends Result.Tag = never,
	> =
		[S, V, T] extends [unknown, unknown, unknown]
			? V extends Result<Result.Status, infer T1, infer V1>
				? Result<S, [T] extends [never] ? T1 : T, V1>
				: Result<S, [T] extends [never] ? null : T, V>
			: never
}

export type ResultFromWith<
	S extends Result.Status,
> =
	[S] extends [unknown]
		? <
			V,
			T extends Result.Tag = never,
		> (
			value: NonUndefined<V>,
			tag?: T,
		) => (
			ResultFromWith.Return<S, V, T>
		)
		: never

export function ResultFromWith<
	S extends Result.Status,
>(
	status: S,
): (
	ResultFromWith<S>
) {
	return ((value, tag) => {
		const contructor = status === 'ok' ? ResultOk : ResultError
		return ResultIs(value)
			? contructor({ data: value.data, tag: tag ?? value.tag })
			: contructor({ data: value as 1, tag: tag })
	}) as ResultFromWith<S>
}
