import { FlowTryWith } from '../factories/flow-try-create-with'

/**
 * Result union returned by a synchronous flow try operation.
 *
 * @template T
 * Value returned by the try branch.
 *
 * @template C
 * Value returned by the catch branch.
 */
export type FlowTrySync<
	T,
	C = never,
> =
	[T, C] extends [unknown, unknown]
		? FlowTryWith.Return<T, C>
		: never

/**
 * Executes a synchronous operation and returns a result instead of throwing.
 *
 * @param operation
 * Callback or object with `try` and optional `catch` branches.
 *
 * @returns
 * Result produced from the operation return value, catch branch, or runtime error.
 *
 * @example
 * ```ts
 * const result = FlowTrySync(() => 5)
 * ```
 *
 * @example
 * ```ts
 * const result = FlowTrySync({
 * 	try: () => JSON.parse(input),
 * 	catch: () => ({ fallback: true }),
 * })
 * ```
 */
export const FlowTrySync: FlowTryWith<'sync'> = FlowTryWith('sync')
