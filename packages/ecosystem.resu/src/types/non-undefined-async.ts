import type { NonUndefinedSync } from './non-undefined-sync'

// eslint-disable-next-line @internal/inferization-type
export type NonUndefinedAsync<T> = Promise<NonUndefinedSync<T>> | NonUndefinedSync<Awaited<T>>
