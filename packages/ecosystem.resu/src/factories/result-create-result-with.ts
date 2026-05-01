import { Result } from '../models/result'
import type { NonUndefined } from '../types/non-undefined'

export declare namespace ResultWith {
	export type Param<
		T extends Result.Tag,
		D,
	> = {
		tag?: NonUndefined<T>
		data?: NonUndefined<D>
		log?: boolean
	}
}

export type ResultWith<
	S extends Result.Status,
> = <
	T extends Result.Tag = null,
	D = null,
> (
	params?: ResultWith.Param<T, D>,
) => (
	Result<S, T, D>
)

export function ResultWith<S extends Result.Status>(status: S): ResultWith<S> {
	return (params) => new Result({ status, ...params })
}
