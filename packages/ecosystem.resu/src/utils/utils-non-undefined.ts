/**
 * Removes `undefined` and `void` from a value position.
 *
 * @template T
 * Source value type.
 */
export type UtilsNonUndefined<T> = [T] extends [unknown]
	? T & Exclude<T, undefined | void> // eslint-disable-line @typescript-eslint/no-invalid-void-type
	: never
