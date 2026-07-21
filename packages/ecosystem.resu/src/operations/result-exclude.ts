import type { Result } from '../classes/result'
import type { ResultAny } from './result-any'

/**
 * Excludes result variants by status and optional tag from a union.
 *
 * @template R
 * Source result union to filter.
 *
 * @template S
 * Result status to remove.
 *
 * @template T
 * Optional tag to remove within the status.
 */
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
