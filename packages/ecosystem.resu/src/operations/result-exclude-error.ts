import type { Result } from '../classes/result'
import type { ResultAny } from './result-any'
import type { ResultExclude } from './result-exclude'

export type ResultExcludeError<
	R extends ResultAny,
	T extends Result.Tag = never,
> =
	[R, T] extends [unknown, unknown]
		? ResultExclude<R, 'error', T>
		: never
