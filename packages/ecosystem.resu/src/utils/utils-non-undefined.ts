/**
 * Removes `undefined` and `void` from concrete value types.
 *
 * Broad `unknown` and `any` inputs remain unchanged.
 *
 * @template T
 * Source value type.
 */
// eslint-disable-next-line
export type UtilsNonUndefined<T> = T & Exclude<T, undefined | void>
