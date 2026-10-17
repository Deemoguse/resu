/**
 * Mutable array tuple that requires at least one item and is assignable to `T[]`.
 * Enforces non-empty inputs at the type level; performs no runtime validation.
 *
 * @template T
 * Item type stored in the tuple.
 */
// eslint-disable-next-line @internal/inferization-type
export type UtilsNonAmptyArray<T> = [T, ...T[]] & T[]
