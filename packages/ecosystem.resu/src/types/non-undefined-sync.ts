/**
 * Removes `undefined` and `void` from a synchronous value position.
 *
 * @template T
 * Source value type.
 */
// eslint-disable-next-line @internal/inferization-type, @typescript-eslint/no-invalid-void-type, @internal/inferization-type
export type NonUndefinedSync<T> = T & Exclude<T, undefined | void>
