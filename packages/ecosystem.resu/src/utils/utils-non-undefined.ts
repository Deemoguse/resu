/**
 * Removes `undefined` and `void` from a value position.
 *
 * @template T
 * Source value type.
 */
// eslint-disable-next-line
export type UtilsNonUndefined<T> = T & Exclude<T, undefined | void>
