import type { UtilsNonUndefined } from './utils-non-undefined'
import type { UtilsSource } from './utils-source'

/**
 * Non-promise flow callback source type without `undefined` or `void`.
 *
 * Use this inside sync callback contracts, and wrap it in `Promise` explicitly
 * for async callback contracts.
 *
 * @template T
 * Declared value or result type produced by the callback.
 */
export type UtilsNonUndefinedSource<T> = [T] extends [unknown]
	? T extends Promise<unknown>
		? never
		: UtilsSource<UtilsNonUndefined<T>>
	: never
