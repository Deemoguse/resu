import type { Result } from '../classes/result'

/**
 * Extracts structured result variants by status and optional tag from a union.
 *
 * @template V
 * Source union to filter.
 *
 * @template S
 * Result status to keep.
 *
 * @template T
 * Optional tag to keep within the status.
 */
export type ResultExtract<
	V,
	S extends Result.Status,
	T extends Result.Tag = never,
> =
	[V, S, T] extends [unknown, unknown, unknown]
		? [T] extends [never]
			? Extract<V, Result<{ status: S, tag: Result.AnyTag, data: Result.AnyData }>>
			: Extract<V, Result<{ status: S, tag: T, data: Result.AnyData }>>
		: never
