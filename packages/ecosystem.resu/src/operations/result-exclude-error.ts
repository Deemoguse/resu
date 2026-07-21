import type { Result } from '../classes/result'
import type { ResultAny } from './result-any'
import type { ResultExclude } from './result-exclude'

/**
 * Excludes error result variants by optional tag from a union.
 *
 * @template R
 * Source result union to filter.
 *
 * @template T
 * Optional error tag to remove.
 */
export type ResultExcludeError<
	R extends ResultAny,
	T extends Result.Tag = never,
> =
	[R, T] extends [unknown, unknown]
		? ResultExclude<R, 'error', T>
		: never
