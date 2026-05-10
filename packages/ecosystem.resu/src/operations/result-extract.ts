import type { Result } from '../classes/result'
import type { ResultAny } from './result-any'

export type ResultExtract<
	R extends ResultAny,
	S extends Result.Status,
	T extends Result.Tag = never,
> =
	[R, S, T] extends [unknown, unknown, unknown]
		? [T] extends [never]
			? Extract<R, { status: S }>
			: Extract<R, { status: S, tag: T }>
		: never
