/**
 * Removes `undefined` and `void` from a synchronous value position.
 *
 * @template T
 * Source value type.
 */
export type UtilsNonUndefinedSync<T> = [T] extends [unknown]
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	? T & Exclude<T, undefined | void>
	: never
