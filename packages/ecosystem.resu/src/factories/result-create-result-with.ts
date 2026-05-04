import { Result } from '../models/result'
import type { NonUndefined } from '../types/non-undefined'

export declare namespace ResultWith {
	export type Param<
		T extends Result.Tag,
		D,
	> =
		[T, D] extends [unknown, unknown]
			? {
				tag?: NonUndefined<T>
				data?: NonUndefined<D>
				log?: boolean
			}
			: never
}

export type ResultWith<
	S extends Result.Status,
> =
	[S] extends [unknown]
		? <
			T extends Result.Tag = null,
			D = null,
		> (
			params?: ResultWith.Param<T, D>,
		) => (
			Result<S, T, D>
		)
		: never

export function ResultWith<S extends Result.Status>(status: S): ResultWith<S> {
	return (params) => new Result({ status, ...params })
}
