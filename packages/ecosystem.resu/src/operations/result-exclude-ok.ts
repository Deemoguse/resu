import type { Result } from '../classes/result'
import type { ResultAny } from './result-any'
import type { ResultExclude } from './result-exclude'

/**
 * Excludes ok result variants by optional tag from a union.
 *
 * @template R
 * Source result union to filter.
 *
 * @template T
 * Optional ok tag to remove.
 */
export type ResultExcludeOk<
	R extends ResultAny,
	T extends Result.Tag = never,
> =
	[R, T] extends [unknown, unknown]
		? ResultExclude<R, 'ok', T>
		: never
