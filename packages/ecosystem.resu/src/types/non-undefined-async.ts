import type { NonUndefinedSync } from './non-undefined-sync'

/**
 * Allows a direct or promised value while excluding `undefined` and `void`.
 *
 * @template T
 * Source value or promise type.
 */
// eslint-disable-next-line @internal/inferization-type
export type NonUndefinedAsync<T> = Promise<NonUndefinedSync<T>> | NonUndefinedSync<Awaited<T>>
