import type { UtilsNonUndefinedSync } from './utils-non-undefined-sync'

/**
 * Allows a direct or promised value while excluding `undefined` and `void`.
 *
 * @template T
 * Source value or promise type.
 */
export type UtilsNonUndefinedAsync<T> = [T] extends [unknown]
	? Promise<UtilsNonUndefinedSync<Awaited<T>>> | UtilsNonUndefinedSync<Awaited<T>>
	: never
