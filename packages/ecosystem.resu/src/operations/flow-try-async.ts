import { FlowTryWith } from '../factories/flow-try-create-with'

/**
 * Promise resolving to the result union returned by an async flow try operation.
 *
 * @template T
 * Value returned by the try branch.
 *
 * @template C
 * Value returned by the catch branch.
 *
 * @template S
 * Whether abort signaling is required by the operation type.
 */
export type FlowTryAsync<
	T,
	C = never,
	S extends boolean = false,
> =
	[T, C, S] extends [unknown, unknown, unknown]
		? Promise<FlowTryWith.Return<T, C, S>>
		: never

/**
 * Executes an async operation and resolves to a result instead of rejecting.
 *
 * @param operation
 * Callback or object with `try`, optional `catch`, and optional `signal`.
 *
 * @returns
 * Promise resolving to a result from the operation, catch branch, runtime error,
 * or abort error.
 *
 * @example
 * ```ts
 * const result = await FlowTryAsync(async () => 5)
 * ```
 *
 * @example
 * ```ts
 * const result = await FlowTryAsync({
 * 	signal: controller.signal,
 * 	try: async (signal) => fetch(url, { signal }),
 * 	catch: () => null,
 * })
 * ```
 */
export const FlowTryAsync: FlowTryWith<'async'> = FlowTryWith('async')
