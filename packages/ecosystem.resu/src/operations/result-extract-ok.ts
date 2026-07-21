import type { Result } from '../classes/result'
import type { ResultExtract } from './result-extract'

/**
 * Extracts ok result variants by optional tag from a union.
 *
 * @template V
 * Source union to filter.
 *
 * @template T
 * Optional ok tag to keep.
 */
export type ResultExtractOk<
	V,
	T extends Result.Tag = never,
> =
	[V, T] extends [unknown, unknown]
		? ResultExtract<V, 'ok', T>
		: never
