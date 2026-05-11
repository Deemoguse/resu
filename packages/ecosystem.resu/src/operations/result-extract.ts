import type { Result } from '../classes/result'

export type ResultExtract<
	V,
	S extends Result.Status,
	T extends Result.Tag = never,
> =
	[V, S, T] extends [unknown, unknown, unknown]
		? [T] extends [never]
			? Extract<V, Result<S, Result.AnyTag, Result.AnyData>>
			: Extract<V, Result<S, T, Result.AnyData>>
		: never
