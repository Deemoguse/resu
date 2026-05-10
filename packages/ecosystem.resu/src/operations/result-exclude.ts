import type { Result } from '../classes/result'
import type { ResultAny } from './result-any'

export type ResultExclude<
	R extends ResultAny,
	S extends Result.Status,
	T extends Result.Tag = never,
> =
	[R, S, T] extends [unknown, unknown, unknown]
		? [T] extends [never]
			? Exclude<R, { status: S }>
			: Exclude<R, { status: S, tag: T }>
		: never
