/**
 * Tuple type that requires at least one item.
 *
 * @template T
 * Item type stored in the tuple.
 */
// eslint-disable-next-line @internal/inferization-type
export type NonAmptyArray<T> = [T, ...T[]]
