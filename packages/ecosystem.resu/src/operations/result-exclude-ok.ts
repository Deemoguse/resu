import type { Result } from '../classes/result'
import type { ResultAny } from './result-any'
import type { ResultExclude } from './result-exclude'

export type ResultExcludeOk<
	R extends ResultAny,
	T extends Result.Tag = never,
> =
	[R, T] extends [unknown, unknown]
		? ResultExclude<R, 'ok', T>
		: never
