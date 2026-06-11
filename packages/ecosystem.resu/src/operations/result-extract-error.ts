import type { Result } from '../classes/result'
import type { ResultExtract } from './result-extract'

/**
 * Extracts error result variants by optional tag from a union.
 *
 * @template V
 * Source union to filter.
 *
 * @template T
 * Optional error tag to keep.
 */
export type ResultExtractError<
	V,
	T extends Result.Tag = never,
> =
	[V, T] extends [unknown, unknown]
		? ResultExtract<V, 'error', T>
		: never
